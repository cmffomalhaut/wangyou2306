import type {
  BattleLogEntry,
  BattleState,
  BattleUnitState,
  EngineResolveResult,
  PassiveDefinition,
  PendingCommand,
  RollResult,
  SideKey,
  StatData,
  UnitLocator,
} from './types';
import { generateEnemyCommand } from './ai';
import { validatePendingCommand, type ValidatedCommandContext } from './commands';
import { deriveUnit } from './derive';
import { applyEffectList, applyModifierStats, applySkillEffects, refreshUnitAvailability } from './effects';
import { resolveAttackCheck, resolveEscapeAction, resolveSavingThrow } from './roll';
import { applyBattleSummaryToRecords as applySettlementToRecords, buildSummary } from './settlement';

function clone<T>(value: T): T {
  return _.cloneDeep(value);
}

function clamp(value: number, min: number, max: number): number {
  return _.clamp(value, min, max);
}

function nowId(prefix: string): string {
  return `${prefix}_${Date.now()}_${_.random(1000, 9999)}`;
}

function createLog(
  state: BattleState,
  type: BattleLogEntry['type'],
  text: string,
  extra: Partial<BattleLogEntry> = {},
): BattleLogEntry {
  return {
    id: nowId('log'),
    turn: state.回合数,
    phase: state.当前阶段,
    type,
    text,
    ...extra,
  };
}

function pushLogText(logs: BattleLogEntry[], state: BattleState, type: BattleLogEntry['type'], text: string): void {
  logs.push(createLog(state, type, text));
}

function buildActionBlockedReason(
  validated: Extract<ReturnType<typeof validatePendingCommand>, { ok: false }>,
): string {
  return `行动已取消：${validated.reason}`;
}

function buildInitiativeQueue(state: BattleState): string[] {
  return [...state.参战方.ally.单位列表, ...state.参战方.enemy.单位列表]
    .filter(unit => unit.是否存活)
    .sort((a, b) => a.行动计数器 - b.行动计数器)
    .map(unit => unit.unitId);
}

function getNextActorByCTB(state: BattleState): UnitLocator | null {
  const all = [...state.参战方.ally.单位列表, ...state.参战方.enemy.单位列表].filter(u => u.是否存活);
  if (!all.length) return null;
  const next = all.reduce((a, b) => (a.行动计数器 <= b.行动计数器 ? a : b));
  return locateUnit(state, next.unitId);
}

function locateUnit(state: BattleState, unitId?: string): UnitLocator | null {
  if (!unitId) return null;

  const allyIndex = state.参战方.ally.单位列表.findIndex(unit => unit.unitId === unitId);
  if (allyIndex >= 0) {
    return { side: 'ally', index: allyIndex, unit: state.参战方.ally.单位列表[allyIndex] };
  }

  const enemyIndex = state.参战方.enemy.单位列表.findIndex(unit => unit.unitId === unitId);
  if (enemyIndex >= 0) {
    return { side: 'enemy', index: enemyIndex, unit: state.参战方.enemy.单位列表[enemyIndex] };
  }

  return null;
}

function getCurrentActor(state: BattleState): UnitLocator | null {
  return locateUnit(state, state.当前行动单位Id);
}

function rebuildActionState(state: BattleState): void {
  const actor = getCurrentActor(state);
  if (!actor || !actor.unit.是否存活) {
    state.玩家输入态 = {
      可操作: false,
      可用行动: [],
    };
    return;
  }

  state.玩家输入态 = {
    可操作: actor.side === 'ally',
    待选技能Id: undefined,
    待选目标Id: undefined,
    可用行动: actor.side === 'ally' ? ['skill', 'item', 'defend', 'escape'] : [],
  };
}

function nextLivingUnitId(state: BattleState, fromIndex: number): string | undefined {
  for (let i = fromIndex; i < state.先攻队列.length; i += 1) {
    const unit = locateUnit(state, state.先攻队列[i]);
    if (unit?.unit.是否存活 && unit.unit.是否可行动) {
      return unit.unit.unitId;
    }
  }
  return undefined;
}

function refreshAllAvailability(state: BattleState): void {
  [...state.参战方.ally.单位列表, ...state.参战方.enemy.单位列表].forEach(refreshUnitAvailability);
}

function getPassiveDefinitions(data: StatData, unit: BattleUnitState): PassiveDefinition[] {
  const record = data.角色档案[unit.sourceCharacterId];
  if (!record) return [];
  return record.被动表
    .filter(passive => passive.已解锁)
    .map(passive => data.被动定义表[passive.passiveId])
    .filter((item): item is PassiveDefinition => !!item);
}

function consumeResources(actor: BattleUnitState, context: ValidatedCommandContext): void {
  const skill = context.skill;
  if (!skill) return;
  actor.当前资源.MP = clamp(actor.当前资源.MP - skill.消耗.MP, 0, actor.当前资源.MPMax);
  actor.当前资源.HP = clamp(actor.当前资源.HP - skill.消耗.HP, 0, actor.当前资源.HPMax);
  const runtimeSkill = context.runtimeSkill;
  if (runtimeSkill) {
    runtimeSkill.当前冷却 = skill.消耗.冷却回合;
  }
}

function runPassiveTrigger(
  data: StatData,
  state: BattleState,
  unit: BattleUnitState,
  trigger: PassiveDefinition['触发时机'],
): BattleLogEntry[] {
  const logs: BattleLogEntry[] = [];
  const passives = getPassiveDefinitions(data, unit).filter(passive => passive.触发时机 === trigger);
  passives.forEach(passive => {
    if (!passive.效果列表.length) return;
    logs.push(
      ...applyEffectList({
        state,
        actor: unit,
        target: unit,
        effects: passive.效果列表,
        skillId: passive.id,
        rules: data.规则配置,
        createLog,
      }),
    );
  });
  return logs;
}

function tickStatus(state: BattleState, unit: BattleUnitState): BattleLogEntry[] {
  const logs: BattleLogEntry[] = [];
  unit.状态列表.forEach(status => {
    if (!unit.是否存活) return;
    if (['burn', 'poison', 'bleed'].includes(status.statusId)) {
      const amount = Math.max(1, Math.floor(status.强度 ?? 4));
      const shieldDamage = Math.min(unit.当前资源.Shield, amount);
      unit.当前资源.Shield -= shieldDamage;
      const damage = Math.min(amount - shieldDamage, unit.当前资源.HP);
      unit.当前资源.HP -= damage;
      logs.push(
        createLog(state, 'damage', `${unit.名字} 受到 ${status.名称} 伤害 ${damage} 点。`, {
          actorId: status.来源单位Id,
          targetId: unit.unitId,
        }),
      );
    }
  });

  unit.状态列表 = unit.状态列表
    .map(status => ({ ...status, 剩余回合: status.剩余回合 - 1 }))
    .filter(status => status.剩余回合 > 0);
  unit.修正器列表 = unit.修正器列表
    .map(modifier => ({ ...modifier, 剩余回合: modifier.剩余回合 - 1 }))
    .filter(modifier => modifier.剩余回合 > 0);
  applyModifierStats(unit);
  refreshUnitAvailability(unit);
  return logs;
}

function decrementCooldowns(unit: BattleUnitState): void {
  unit.技能栏 = unit.技能栏.map(skill => ({ ...skill, 当前冷却: Math.max(0, skill.当前冷却 - 1) }));
}

function findWinner(state: BattleState): SideKey | 'draw' | null {
  const allyAlive = state.参战方.ally.单位列表.some(unit => unit.是否存活);
  const enemyAlive = state.参战方.enemy.单位列表.some(unit => unit.是否存活);
  if (allyAlive && enemyAlive) return null;
  if (allyAlive) return 'ally';
  if (enemyAlive) return 'enemy';
  return 'draw';
}

function endBattle(
  data: StatData,
  state: BattleState,
  logs: BattleLogEntry[],
  winner: SideKey | 'draw' | 'escape',
): void {
  state.状态 = 'ended';
  state.当前阶段 = 'battle_end';
  state.待处理指令 = undefined;
  state.结算结果 = buildSummary(data, state, winner);
  logs.push(
    createLog(
      state,
      winner === 'ally' ? 'victory' : winner === 'enemy' ? 'defeat' : 'system',
      winner === 'escape'
        ? '成功脱离战斗。'
        : winner === 'ally'
          ? '我方获胜。'
          : winner === 'enemy'
            ? '敌方获胜。'
            : '战斗平局。',
    ),
  );
}

function prepareTurnStart(data: StatData, state: BattleState, logs: BattleLogEntry[]): void {
  const actorLocator = getNextActorByCTB(state);
  if (!actorLocator) return;
  state.当前行动单位Id = actorLocator.unit.unitId;
  state.当前阶段 = 'select_action';
  const actor = getCurrentActor(state);
  if (!actor) return;

  logs.push(...runPassiveTrigger(data, state, actor.unit, 'turn_start'));
  pushLogText(logs, state, 'system', `${actor.unit.名字} 开始行动。`);
  rebuildActionState(state);
  if (actor.side === 'enemy') {
    state.待处理指令 = generateEnemyCommand(data, state, actor);
  }
}

function finishRound(data: StatData, state: BattleState, logs: BattleLogEntry[]): void {
  const actor = getCurrentActor(state);
  if (actor) {
    const all = [...state.参战方.ally.单位列表, ...state.参战方.enemy.单位列表].filter(u => u.是否存活);
    const minCounter = all.reduce((min, u) => Math.min(min, u.行动计数器), Infinity);
    const resetValue = Math.max(10, 100 - actor.unit.当前属性.先攻 * 3);
    actor.unit.行动计数器 = minCounter + resetValue;
    logs.push(...runPassiveTrigger(data, state, actor.unit, 'turn_end'));
    logs.push(...finishTurn(data, state));
  }

  state.回合数 += 1;
  state.先攻队列 = buildInitiativeQueue(state);
  state.当前阶段 = 'turn_start';
  state.待处理指令 = undefined;
  rebuildActionState(state);
}

function resolveCommand(
  data: StatData,
  state: BattleState,
  actor: UnitLocator,
  validated: Extract<ReturnType<typeof validatePendingCommand>, { ok: true }>,
  logs: BattleLogEntry[],
  rolls: RollResult[],
): boolean {
  const command = validated.context.command;
  const rules = data.规则配置;
  let escaped = false;

  state.当前阶段 = 'resolve_action';
  if (command.actionType === 'skill') {
    const result = resolveSkillAction(data, state, validated.context);
    logs.push(...result.logs);
    rolls.push(...result.rolls);
  } else if (command.actionType === 'item') {
    logs.push(...resolveItemAction(state, validated.context));
    if (validated.context.item) {
      data.背包[validated.context.item.id].数量 = Math.max(0, data.背包[validated.context.item.id].数量 - 1);
    }
  } else if (command.actionType === 'defend') {
    logs.push(...resolveDefendAction(state, validated.context.actor));
  } else if (command.actionType === 'escape') {
    const roll = resolveEscapeAction(actor.unit, rules);
    logs.push(
      createLog(state, 'roll', `${actor.unit.名字} 尝试逃跑，检定 ${roll.finalRoll}/${rules.资源规则.逃跑基础DC}。`, {
        actorId: actor.unit.unitId,
        payload: roll,
      }),
    );
    rolls.push(roll);
    escaped = roll.success;
  }

  actor.unit.标记.本回合已行动 = true;
  refreshAllAvailability(state);
  return escaped;
}

function resolveItemAction(state: BattleState, context: ValidatedCommandContext): BattleLogEntry[] {
  const logs: BattleLogEntry[] = [];
  const { actor, item, targets } = context;
  const target = targets[0]?.unit ?? actor.unit;
  if (!item) return logs;

  if (item.回复HP) {
    const before = target.当前资源.HP;
    target.当前资源.HP = clamp(target.当前资源.HP + item.回复HP, 0, target.当前资源.HPMax);
    logs.push(
      createLog(state, 'heal', `${actor.unit.名字} 使用 ${item.名称}，恢复 ${target.当前资源.HP - before} 点生命。`, {
        actorId: actor.unit.unitId,
      }),
    );
  }
  if (item.回复MP) {
    const before = target.当前资源.MP;
    target.当前资源.MP = clamp(target.当前资源.MP + item.回复MP, 0, target.当前资源.MPMax);
    logs.push(
      createLog(
        state,
        'resource',
        `${actor.unit.名字} 使用 ${item.名称}，恢复 ${target.当前资源.MP - before} 点法力。`,
        { actorId: actor.unit.unitId },
      ),
    );
  }
  return logs;
}

function resolveDefendAction(state: BattleState, actor: UnitLocator): BattleLogEntry[] {
  actor.unit.标记.防御中 = true;
  return [createLog(state, 'action', `${actor.unit.名字} 进入防御姿态。`, { actorId: actor.unit.unitId })];
}

function resolveSkillAction(
  data: StatData,
  state: BattleState,
  context: ValidatedCommandContext,
): { logs: BattleLogEntry[]; rolls: RollResult[] } {
  const logs: BattleLogEntry[] = [];
  const rolls: RollResult[] = [];
  const { actor, skill, targets } = context;
  if (!skill) return { logs, rolls };

  consumeResources(actor.unit, context);
  logs.push(
    createLog(state, 'action', `${actor.unit.名字} 使用了 ${skill.名称}。`, {
      actorId: actor.unit.unitId,
      skillId: skill.id,
    }),
  );

  targets.forEach(target => {
    let checkPassed = true;
    let roll: RollResult | undefined;
    if (skill.检定.类型 === 'attack_roll') {
      roll = resolveAttackCheck(actor.unit, target.unit, skill);
      checkPassed = roll.success;
    } else if (skill.检定.类型 === 'saving_throw') {
      roll = resolveSavingThrow(actor.unit, target.unit, skill, data.规则配置);
      checkPassed = !roll.success;
    }
    if (roll) {
      rolls.push(roll);
      logs.push(
        createLog(
          state,
          'roll',
          `${actor.unit.名字} 对 ${target.unit.名字} 的检定结果为 ${roll.finalRoll}${roll.dc ? ` / DC ${roll.dc}` : ''}。`,
          {
            actorId: actor.unit.unitId,
            targetId: target.unit.unitId,
            skillId: skill.id,
            payload: roll,
          },
        ),
      );
    }
    const savedSuccessfully = skill.检定.类型 === 'saving_throw' && roll?.success;
    if (!checkPassed && !savedSuccessfully) {
      logs.push(
        createLog(state, 'system', `${skill.名称} 对 ${target.unit.名字} 未能生效。`, {
          actorId: actor.unit.unitId,
          targetId: target.unit.unitId,
          skillId: skill.id,
        }),
      );
      return;
    }

    if (savedSuccessfully) {
      logs.push(
        createLog(state, 'system', `${target.unit.名字} 豁免成功，受到半数伤害。`, {
          actorId: actor.unit.unitId,
          targetId: target.unit.unitId,
          skillId: skill.id,
        }),
      );
    }

    logs.push(
      ...applySkillEffects({
        state,
        actor: actor.unit,
        target: target.unit,
        skill,
        rules: data.规则配置,
        createLog,
        halfDamage: savedSuccessfully,
      }),
    );
  });

  return { logs, rolls };
}

function finishTurn(data: StatData, state: BattleState): BattleLogEntry[] {
  const logs: BattleLogEntry[] = [];
  state.参战方.ally.单位列表.forEach(unit => {
    unit.标记.本回合已行动 = false;
    unit.标记.防御中 = false;
    decrementCooldowns(unit);
    logs.push(...tickStatus(state, unit));
    logs.push(...runPassiveTrigger(data, state, unit, 'turn_end'));
  });
  state.参战方.enemy.单位列表.forEach(unit => {
    unit.标记.本回合已行动 = false;
    unit.标记.防御中 = false;
    decrementCooldowns(unit);
    logs.push(...tickStatus(state, unit));
    logs.push(...runPassiveTrigger(data, state, unit, 'turn_end'));
  });
  refreshAllAvailability(state);
  return logs;
}

export function initializeBattleState(data: StatData): BattleState {
  const recordList = Object.values(data.角色档案);
  const allyRecords = recordList.filter(record => ['player', 'ally'].includes(record.阵营));
  const enemyRecords = recordList.filter(record => record.阵营 === 'enemy');

  const state: BattleState = {
    battleId: data.战斗状态?.battleId ?? nowId('battle'),
    状态: 'running',
    模式: data.战斗状态?.模式 ?? 'pve',
    回合数: 1,
    当前行动单位Id: undefined,
    当前阶段: 'turn_start',
    行动游标: 0,
    参战方: {
      ally: {
        阵营名: '我方',
        单位列表: allyRecords.map(record => deriveUnit(record, 'ally')),
      },
      enemy: {
        阵营名: '敌方',
        单位列表: enemyRecords.map(record => deriveUnit(record, 'enemy')),
      },
    },
    先攻队列: [],
    日志: [],
    随机种子: data.战斗状态?.随机种子,
    玩家输入态: {
      可操作: false,
      可用行动: [],
    },
    待处理指令: undefined,
    结算结果: undefined,
  };

  // CTB 初始计数器加随机偏移，避免先攻最高者永远先手
  [...state.参战方.ally.单位列表, ...state.参战方.enemy.单位列表].forEach(unit => {
    const base = Math.max(10, 100 - unit.当前属性.先攻 * 3);
    unit.行动计数器 = base + _.random(0, Math.floor(base * 0.5));
  });

  state.先攻队列 = buildInitiativeQueue(state);
  state.当前行动单位Id = state.先攻队列[0];
  const passiveLogs = [...state.参战方.ally.单位列表, ...state.参战方.enemy.单位列表].flatMap(unit =>
    runPassiveTrigger(data, state, unit, 'battle_start'),
  );
  state.日志.push(createLog(state, 'system', '战斗开始。'));
  state.日志.push(...passiveLogs);
  rebuildActionState(state);
  return state;
}

export function advanceBattle(data: StatData, inputCommand?: PendingCommand): EngineResolveResult {
  if (!data.战斗状态) {
    const initialized = initializeBattleState(data);
    return {
      state: initialized,
      logs: initialized.日志,
      rolls: [],
    };
  }

  const state = clone(data.战斗状态);
  const logs: BattleLogEntry[] = [];
  const rolls: RollResult[] = [];

  if (state.状态 === 'preparing') {
    const initialized = initializeBattleState(data);
    return {
      state: initialized,
      logs: initialized.日志,
      rolls: [],
    };
  }

  refreshAllAvailability(state);
  if (state.先攻队列.length === 0) {
    state.先攻队列 = buildInitiativeQueue(state);
  }

  if (state.当前阶段 === 'turn_start') {
    prepareTurnStart(data, state, logs);
    // 敌方回合：prepareTurnStart 已设置待处理指令，直接继续执行，不需要额外一次 tick
    const earlyActor = getCurrentActor(state);
    if (!earlyActor) {
      endBattle(data, state, logs, 'draw');
      return { state, logs, rolls };
    }
    if (earlyActor.side === 'ally') {
      state.日志.push(...logs);
      return { state, logs, rolls };
    }
  }

  const actor = getCurrentActor(state);
  if (!actor) {
    endBattle(data, state, logs, 'draw');
    return { state, logs, rolls };
  }

  const command = inputCommand ?? state.待处理指令;
  if (!command && actor.side === 'ally') {
    state.日志.push(...logs);
    return { state, logs, rolls };
  }
  if (!command) {
    state.待处理指令 = generateEnemyCommand(data, state, actor);
    state.日志.push(...logs);
    return { state, logs, rolls };
  }

  const validated = validatePendingCommand(data, state, command);
  if (!validated.ok) {
    logs.push(createLog(state, 'system', buildActionBlockedReason(validated), { actorId: actor.unit.unitId }));
    state.待处理指令 = undefined;
    state.日志.push(...logs);
    return { state, logs, rolls };
  }

  const escaped = resolveCommand(data, state, actor, validated, logs, rolls);

  const winner = escaped ? 'escape' : findWinner(state);
  if (winner) {
    endBattle(data, state, logs, winner);
  } else {
    finishRound(data, state, logs);
  }

  state.日志.push(...logs);
  return { state, logs, rolls };
}

export function applyBattleSummaryToRecords(data: StatData): StatData {
  return applySettlementToRecords(data);
}
