// ═══════════════════════════════════════════════════════════════
//  简单卡战斗引擎入口
//
//  流程：
//    MVU（简单格式）──→ simpleToFull() ──→ 引擎（完整格式）
//    战斗期间 MVU 存完整格式（.passthrough() 透传额外字段）
//    结算后 fullToSimple() ──→ MVU（简单格式）
//
//  按钮：开始战斗 / 推进战斗 / 战斗结算 / 清理战斗状态 / 强制重建战斗
// ═══════════════════════════════════════════════════════════════

import {
  simpleToFull,
  fullToSimple,
  isEncounterPending,
  resolveEncounter,
} from './battle_adapter';
import { ENCOUNTER_GROUPS, MONSTER_DB, SKILL_DB } from './battle_data';
import { advanceBattle, applyBattleSummaryToRecords } from '../wangyou/脚本/战斗系统/engine';
import type { StatData as FullStatData, PendingCommand, BattleState, CharacterRecord } from '../wangyou/脚本/战斗系统/types';
import type { MonsterTemplate } from '../wangyou/脚本/战斗系统/monsters';

const AUTO_ADVANCE_LIMIT = 24;
const MESSAGE_ID = -1;

// ────────────────────────────────────────────
//  MVU 读写
// ────────────────────────────────────────────

function readFullData(): FullStatData {
  const variables = Mvu.getMvuData({ type: 'message', message_id: MESSAGE_ID });
  return (_.get(variables, 'stat_data', {}) ?? {}) as FullStatData;
}

async function writeData(data: Record<string, unknown>): Promise<void> {
  const variables = _.cloneDeep(Mvu.getMvuData({ type: 'message', message_id: MESSAGE_ID }));
  _.set(variables, 'stat_data', data);
  await Mvu.replaceMvuData(variables, { type: 'message', message_id: MESSAGE_ID });
}

// ────────────────────────────────────────────
//  怪物加载（直接操作 FullStatData）
// ────────────────────────────────────────────

function createMonsterRecord(template: MonsterTemplate, uniqueId: string): CharacterRecord {
  const expRequired = 100 + Math.max(0, template.level - 1) * 60;

  return {
    id: uniqueId,
    名字: template.name,
    阵营: 'enemy',
    简介: template.description ?? '',
    标签: template.tags ?? ['敌人'],
    等级: template.level,
    经验值: { 当前值: 0, 升级所需值: expRequired },
    成长: { 未分配属性点: 0 },
    七维: { ...template.stats },
    资源: {
      生命值: { 当前值: template.hp, 最大值: template.hp },
      法力值: { 当前值: template.mp, 最大值: template.mp },
    },
    派生基线: {
      护甲等级: template.ac,
      控制强度: template.controlStrength ?? 0,
      异常抗性: template.anomalyResistance ?? 0,
    },
    战斗定位: {
      职业: template.job ?? '怪物',
      流派: template.style ?? '均衡',
      伤害偏向: template.damageBias ?? 'physical',
    },
    抗性: { 伤害抗性: {}, 状态抗性: {} },
    装备栏: {},
    技能表: template.skills.map((skill, i) => ({
      slotId: skill.slotId ?? `s${i + 1}`,
      skillId: skill.skillId,
      已装备: true,
      已解锁: true,
      来源: '初始',
    })),
    被动表: (template.passives ?? []).map((passiveId, i) => ({
      slotId: `p${i + 1}`,
      passiveId,
      已解锁: true,
      来源: '初始',
    })),
    可用道具栏: [],
  };
}

function loadEncounterMonsters(full: FullStatData): { full: FullStatData; monsterIds: string[] } {
  const encounterId = full.世界.当前遭遇;
  if (!encounterId) return { full, monsterIds: [] };

  const group = ENCOUNTER_GROUPS[encounterId];
  if (!group) return { full, monsterIds: [] };

  const next = _.cloneDeep(full);
  const monsterIds: string[] = [];
  const addedSkills = new Set(Object.keys(next.技能定义表));

  for (const entry of group.monsters) {
    const template = MONSTER_DB[entry.monsterId];
    if (!template) continue;

    // 补全怪物技能定义
    for (const skill of template.skills) {
      if (!addedSkills.has(skill.skillId) && SKILL_DB[skill.skillId]) {
        next.技能定义表[skill.skillId] = SKILL_DB[skill.skillId];
        addedSkills.add(skill.skillId);
      }
    }

    for (let i = 1; i <= entry.count; i++) {
      const uniqueId = `${entry.monsterId}_${i}`;
      next.角色档案[uniqueId] = createMonsterRecord(template, uniqueId);
      monsterIds.push(uniqueId);
    }
  }

  next.遭遇怪物列表 = monsterIds;
  next.世界.当前遭遇 = null;

  return { full: next, monsterIds };
}

// ────────────────────────────────────────────
//  主循环
// ────────────────────────────────────────────

function shouldPauseForPlayer(command: PendingCommand | undefined, state: BattleState): boolean {
  if (!state || state.状态 === 'ended') return true;
  return state.玩家输入态.可操作 && state.当前阶段 === 'select_action' && !command;
}

async function runBattleLoop(full: FullStatData, command?: PendingCommand): Promise<FullStatData> {
  let nextCommand = command;
  let current = _.cloneDeep(full);

  for (let tick = 0; tick < AUTO_ADVANCE_LIMIT; tick += 1) {
    const result = advanceBattle(current, nextCommand);
    current.战斗状态 = result.state;

    if (result.state.状态 === 'ended') {
      // 结算结果由 handleSettleBattle 统一处理
      current.战斗状态 = result.state;
      await writeData(current as unknown as Record<string, unknown>);
      return current;
    }

    if (result.state.玩家输入态.可操作 && result.state.当前阶段 === 'select_action') {
      await writeData(current as unknown as Record<string, unknown>);
      return current;
    }

    nextCommand = (result.state as BattleState & { 待处理指令?: PendingCommand }).待处理指令 ?? undefined;
    if (!nextCommand && shouldPauseForPlayer(undefined, result.state)) {
      await writeData(current as unknown as Record<string, unknown>);
      return current;
    }
  }

  throw new Error(`战斗自动推进超过 ${AUTO_ADVANCE_LIMIT} 次，已中止以避免死循环。`);
}

// ────────────────────────────────────────────
//  按钮处理
// ────────────────────────────────────────────

async function handleStartBattle(): Promise<void> {
  const raw = readFullData();

  // 检查是否需要初始化（从简单格式转完整格式）
  const needsInit = !raw.规则配置 || !raw.技能定义表;

  let full: FullStatData;
  if (needsInit) {
    // 首次：简单 → 完整，合并硬编码数据
    full = simpleToFull(raw as unknown as import('./battle_adapter').SimpleStatData);

    // 加载遭遇怪物
    if (full.世界.当前遭遇) {
      const result = loadEncounterMonsters(full);
      full = result.full;
    }
  } else {
    // 已有完整数据（从上次 tick 继续）
    full = raw;

    // 如果有待处理的遭遇，加载怪物
    if (full.世界.当前遭遇) {
      const result = loadEncounterMonsters(full);
      full = result.full;
    }
  }

  await runBattleLoop(full);
}

async function handleAdvanceBattle(): Promise<void> {
  const full = readFullData();
  const state = full.战斗状态 as BattleState | null;
  const command = (state as BattleState & { 待处理指令?: PendingCommand })?.待处理指令 ?? undefined;
  await runBattleLoop(full, command ?? undefined);
}

async function handleSettleBattle(): Promise<void> {
  const full = readFullData();

  // 引擎结算
  let next = applyBattleSummaryToRecords(full);

  // 战后清理（删怪物、写纪要、重置状态）
  next = resolveEncounter(next);

  // 完整 → 简单，写回 MVU
  const simple = fullToSimple(next);
  await writeData(simple as unknown as Record<string, unknown>);
}

async function handleClearBattle(): Promise<void> {
  const raw = readFullData();
  // 如果当前是完整格式（有角色档案），先转回简单再清战斗状态
  if (raw.角色档案) {
    const simple = fullToSimple(raw);
    simple.战斗状态 = null;
    await writeData(simple as unknown as Record<string, unknown>);
  } else {
    const simple = raw as unknown as import('./battle_adapter').SimpleStatData;
    simple.战斗状态 = null;
    await writeData(simple as unknown as Record<string, unknown>);
  }
}

async function handleRebuildBattle(): Promise<void> {
  await handleClearBattle();
  await new Promise(resolve => setTimeout(resolve, 100));

  // 重建：简单 → 完整 → 加载怪物 → 开始战斗
  const raw = readFullData();
  let full = simpleToFull(raw as unknown as import('./battle_adapter').SimpleStatData);

  if (full.世界.当前遭遇) {
    const result = loadEncounterMonsters(full);
    full = result.full;
  }

  await runBattleLoop(full);
}

// ────────────────────────────────────────────
//  注册
// ────────────────────────────────────────────

$(() => {
  errorCatched(async () => {
    await waitGlobalInitialized('Mvu');

    eventOn(getButtonEvent('开始战斗'), async () => {
      await handleStartBattle();
    });

    eventOn(getButtonEvent('推进战斗'), async () => {
      await handleAdvanceBattle();
    });

    eventOn(getButtonEvent('战斗结算'), async () => {
      await handleSettleBattle();
    });

    eventOn(getButtonEvent('清理战斗状态'), async () => {
      await handleClearBattle();
    });

    eventOn(getButtonEvent('强制重建战斗'), async () => {
      await handleRebuildBattle();
    });
  })();
});
