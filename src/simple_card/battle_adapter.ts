// ═══════════════════════════════════════════════════════════════
//  适配层 —— 简单卡 MVU 数据 ↔ 引擎完整 Schema
// ═══════════════════════════════════════════════════════════════

import type { CharacterRecord, StatData as FullStatData } from '../wangyou/脚本/战斗系统/types';
import { SKILL_DB, MONSTER_DB, ENCOUNTER_GROUPS, DEFAULT_RULES, DEFAULT_ITEMS } from './battle_data';
import type { MonsterTemplate, EncounterGroup } from '../wangyou/脚本/战斗系统/monsters';

// ────────────────────────────────────────────
//  简单卡类型（与 mvu_schema.ts 对应）
// ────────────────────────────────────────────

export interface SimpleCharacter {
  名字: string;
  等级: number;
  七维: { 力量: number; 敏捷: number; 体质: number; 智力: number; 感知: number; 魅力: number; 幸运: number };
  生命值: { 当前值: number; 最大值: number };
  法力值: { 当前值: number; 最大值: number };
  经验值: { 当前值: number; 升级所需值: number };
  成长: { 未分配属性点: number };
  技能列表: { 技能ID: string; 名称: string; 简介: string }[];
  被动列表: { 被动ID: string; 名称: string; 简介: string }[];
}

export interface SimpleAlly extends SimpleCharacter {
  好感度: number;
}

export interface SimpleStatData {
  世界: {
    时间: string;
    地点: string;
    剧情上下文: string;
    剧情状态: '日常' | '战斗' | '偷袭';
    当前遭遇: string | null;
  };
  主角: SimpleCharacter;
  队友: Record<string, SimpleAlly>;
  金币: number;
  背包: Record<string, { id: string; 名称: string; 简介: string; 数量: number; 战斗可用: boolean }>;
  战斗状态: unknown;
  战斗归档: { battleId: string; winner: string; rounds: number; summary: string; rewards: string[]; timestamp: string }[];
  遭遇怪物列表: string[];
}

// ────────────────────────────────────────────
//  简单 → 完整 Schema
// ────────────────────────────────────────────

function characterToRecord(c: SimpleCharacter, id: string, camp: CharacterRecord['阵营']): CharacterRecord {
  return {
    id,
    名字: c.名字,
    阵营: camp,
    简介: '',
    标签: camp === 'player' ? ['主角'] : ['队友'],
    等级: c.等级,
    经验值: { ...c.经验值 },
    成长: { ...c.成长 },
    七维: { ...c.七维 },
    资源: {
      生命值: { 当前值: c.生命值.当前值, 最大值: c.生命值.最大值 },
      法力值: { 当前值: c.法力值.当前值, 最大值: c.法力值.最大值 },
    },
    派生基线: { 护甲等级: 10, 控制强度: 0, 异常抗性: 0 },
    战斗定位: { 职业: '冒险者', 流派: '均衡', 伤害偏向: 'hybrid' },
    抗性: { 伤害抗性: {}, 状态抗性: {} },
    装备栏: {},
    技能表: c.技能列表.map((skill, i) => ({
      slotId: `s${i + 1}`,
      skillId: skill.技能ID,
      已装备: true,
      已解锁: true,
      来源: '初始',
    })),
    被动表: c.被动列表.map((passive, i) => ({
      slotId: `p${i + 1}`,
      passiveId: passive.被动ID,
      已解锁: true,
      来源: '初始',
    })),
    可用道具栏: Object.keys(c.技能列表).length > 0 ? [] : [],
  };
}

function collectSkillDefs(characters: SimpleCharacter[]): FullStatData['技能定义表'] {
  const defs: FullStatData['技能定义表'] = {};
  const seen = new Set<string>();

  for (const c of characters) {
    for (const skill of c.技能列表) {
      if (seen.has(skill.技能ID)) continue;
      const full = SKILL_DB[skill.技能ID];
      if (full) {
        defs[skill.技能ID] = full;
        seen.add(skill.技能ID);
      }
    }
  }

  // 确保 basic_attack 始终存在（怪物也会用）
  if (!seen.has('basic_attack') && SKILL_DB.basic_attack) {
    defs['basic_attack'] = SKILL_DB.basic_attack;
  }

  return defs;
}

export function simpleToFull(data: SimpleStatData): FullStatData {
  const characters: SimpleCharacter[] = [data.主角, ...Object.values(data.队友)];

  const 角色档案: FullStatData['角色档案'] = {};
  角色档案['protagonist'] = characterToRecord(data.主角, 'protagonist', 'player');
  for (const [allyId, ally] of Object.entries(data.队友)) {
    角色档案[allyId] = characterToRecord(ally, allyId, 'ally');
  }

  // 主角可用道具栏：所有战斗可用的背包物品
  const protagonistRecord = 角色档案['protagonist'];
  if (protagonistRecord) {
    protagonistRecord.可用道具栏 = Object.entries(data.背包)
      .filter(([, item]) => item.战斗可用 && item.数量 > 0)
      .map(([id]) => id);
  }

  return {
    世界: { ...data.世界 },
    规则配置: _.cloneDeep(DEFAULT_RULES),
    技能定义表: collectSkillDefs(characters),
    被动定义表: {},
    角色档案,
    背包: _.cloneDeep(data.背包) as FullStatData['背包'],
    遭遇怪物列表: [...data.遭遇怪物列表],
    金币: data.金币,
    战斗归档: data.战斗归档 as FullStatData['战斗归档'],
    战斗状态: data.战斗状态 as FullStatData['战斗状态'],
  };
}

// ────────────────────────────────────────────
//  完整 → 简单 Schema（战后回写）
// ────────────────────────────────────────────

function recordToCharacter(r: CharacterRecord): SimpleCharacter {
  return {
    名字: r.名字,
    等级: r.等级,
    七维: { ...r.七维 },
    生命值: { 当前值: r.资源.生命值.当前值, 最大值: r.资源.生命值.最大值 },
    法力值: { 当前值: r.资源.法力值.当前值, 最大值: r.资源.法力值.最大值 },
    经验值: { ...r.经验值 },
    成长: { ...r.成长 },
    技能列表: r.技能表
      .filter(s => s.已解锁)
      .map(s => {
        const skillDef = SKILL_DB[s.skillId];
        return {
          技能ID: s.skillId,
          名称: skillDef?.名称 ?? s.skillId,
          简介: skillDef?.描述 ?? '',
        };
      }),
    被动列表: r.被动表
      .filter(p => p.已解锁)
      .map(p => ({
        被动ID: p.passiveId,
        名称: p.passiveId,
        简介: '',
      })),
  };
}

export function fullToSimple(data: FullStatData): SimpleStatData {
  const 主角 = data.角色档案['protagonist'];
  const 队友: Record<string, SimpleAlly> = {};

  for (const [id, record] of Object.entries(data.角色档案)) {
    if (id === 'protagonist') continue;
    if (record.阵营 === 'enemy') continue;
    const char = recordToCharacter(record);
    队友[id] = {
      ...char,
      好感度: 0,
    };
  }

  return {
    世界: { ...data.世界 },
    主角: 主角 ? recordToCharacter(主角) : ({} as SimpleCharacter),
    队友,
    金币: data.金币,
    背包: data.背包 as SimpleStatData['背包'],
    战斗状态: data.战斗状态,
    战斗归档: data.战斗归档 as SimpleStatData['战斗归档'],
    遭遇怪物列表: [...data.遭遇怪物列表],
  };
}

// ────────────────────────────────────────────
//  遭遇处理（使用简单卡的怪物 DB）
// ────────────────────────────────────────────

export function isEncounterPending(data: SimpleStatData): boolean {
  const phase = data.世界.剧情状态;
  return (phase === '战斗' || phase === '偷袭') && data.战斗状态 === null;
}

export function isSurpriseAttack(data: SimpleStatData): boolean {
  return data.世界.剧情状态 === '偷袭';
}

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

export function prepareEncounter(data: SimpleStatData): FullStatData {
  const encounterId = data.世界.当前遭遇;
  if (!encounterId) {
    return simpleToFull(data);
  }

  const full = simpleToFull(data);

  const group: EncounterGroup | undefined = ENCOUNTER_GROUPS[encounterId];
  if (!group) {
    return full;
  }

  const monsterIds: string[] = [];
  const monsterSkillIds = new Set<string>();

  for (const entry of group.monsters) {
    const template = MONSTER_DB[entry.monsterId];
    if (!template) continue;

    for (const skill of template.skills) {
      monsterSkillIds.add(skill.skillId);
    }

    for (let i = 1; i <= entry.count; i++) {
      const uniqueId = `${entry.monsterId}_${i}`;
      full.角色档案[uniqueId] = createMonsterRecord(template, uniqueId);
      monsterIds.push(uniqueId);
    }
  }

  // 补全怪物技能定义
  for (const skillId of monsterSkillIds) {
    if (!full.技能定义表[skillId] && SKILL_DB[skillId]) {
      full.技能定义表[skillId] = SKILL_DB[skillId];
    }
  }

  full.遭遇怪物列表 = monsterIds;
  full.世界.当前遭遇 = null;

  return full;
}

export function resolveEncounter(data: FullStatData): FullStatData {
  const next = _.cloneDeep(data);
  const monsterIds = next.遭遇怪物列表;

  if (monsterIds?.length) {
    for (const id of monsterIds) {
      delete next.角色档案[id];
    }
  }

  const archive = next.战斗归档;
  if (archive?.length) {
    const last = archive[archive.length - 1];
    const survivorLines: string[] = [];
    for (const [, record] of Object.entries(next.角色档案)) {
      if (record.阵营 === 'enemy') continue;
      const hp = record.资源.生命值;
      const mp = record.资源.法力值;
      survivorLines.push(`${record.名字} HP ${hp.当前值}/${hp.最大值} MP ${mp.当前值}/${mp.最大值}`);
    }
    next.世界.剧情上下文 = `[战斗纪要] ${last.summary}\n战利品：${last.rewards.join('，')}。\n当前状态：${survivorLines.join('；')}。`;
  }

  next.世界.剧情状态 = '日常';
  next.遭遇怪物列表 = [];

  return next;
}
