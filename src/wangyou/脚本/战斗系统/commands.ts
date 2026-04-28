import type {
  BattleState,
  BattleUnitState,
  InventoryItem,
  PendingCommand,
  RuntimeSkillState,
  SideKey,
  SkillDefinition,
  StatData,
  UnitLocator,
} from './types';

export type ValidatedCommandContext = {
  actor: UnitLocator;
  command: PendingCommand;
  skill?: SkillDefinition;
  runtimeSkill?: RuntimeSkillState;
  item?: InventoryItem;
  targets: UnitLocator[];
};

export type CommandValidationResult = { ok: true; context: ValidatedCommandContext } | { ok: false; reason: string };

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

function getOppositeSide(side: SideKey): SideKey {
  return side === 'ally' ? 'enemy' : 'ally';
}

function canAct(unit: BattleUnitState): boolean {
  return unit.是否存活 && unit.是否可行动;
}

function normalizeTargetIds(targetIds?: string[]): string[] {
  return [...new Set((targetIds ?? []).filter(Boolean))];
}

export function chooseDefaultSkill(data: StatData, unit: BattleUnitState): SkillDefinition | undefined {
  return unit.技能栏.map(skill => data.技能定义表[skill.skillId]).find(Boolean);
}

export function getRuntimeSkill(unit: BattleUnitState, skillId?: string): RuntimeSkillState | undefined {
  return unit.技能栏.find(skill => skill.skillId === skillId);
}

function resolveTargetTypeTargets(
  state: BattleState,
  actor: UnitLocator,
  targetType: SkillDefinition['目标类型'],
): UnitLocator[] {
  if (targetType === 'self') return [actor];

  if (targetType === 'single_ally') {
    const allyTarget = state.参战方[actor.side].单位列表.find(unit => unit.是否存活);
    const located = allyTarget ? locateUnit(state, allyTarget.unitId) : null;
    return located ? [located] : [];
  }

  if (targetType === 'all_allies') {
    return state.参战方[actor.side].单位列表
      .filter(unit => unit.是否存活)
      .map(unit => locateUnit(state, unit.unitId))
      .filter((item): item is UnitLocator => !!item);
  }

  if (targetType === 'all_enemies') {
    return state.参战方[getOppositeSide(actor.side)].单位列表
      .filter(unit => unit.是否存活)
      .map(unit => locateUnit(state, unit.unitId))
      .filter((item): item is UnitLocator => !!item);
  }

  if (targetType === 'random_enemy') {
    const candidates = state.参战方[getOppositeSide(actor.side)].单位列表.filter(unit => unit.是否存活);
    if (!candidates.length) return [];
    const picked = candidates[_.random(0, candidates.length - 1)];
    const located = locateUnit(state, picked.unitId);
    return located ? [located] : [];
  }

  const target = state.参战方[getOppositeSide(actor.side)].单位列表.find(unit => unit.是否存活);
  const located = target ? locateUnit(state, target.unitId) : null;
  return located ? [located] : [];
}

function isTargetLegal(actor: UnitLocator, target: UnitLocator, targetType: SkillDefinition['目标类型']): boolean {
  if (!target.unit.是否存活) return false;
  if (targetType === 'self') return target.unit.unitId === actor.unit.unitId;
  if (targetType === 'single_enemy' || targetType === 'random_enemy' || targetType === 'all_enemies') {
    return target.side !== actor.side;
  }
  if (targetType === 'single_ally' || targetType === 'all_allies') {
    return target.side === actor.side;
  }
  return false;
}

function resolveTargets(
  state: BattleState,
  actor: UnitLocator,
  targetType: SkillDefinition['目标类型'],
  targetIds?: string[],
): UnitLocator[] {
  if (targetType === 'all_enemies' || targetType === 'all_allies' || targetType === 'self') {
    return resolveTargetTypeTargets(state, actor, targetType);
  }

  const normalizedTargetIds = normalizeTargetIds(targetIds);
  if (!normalizedTargetIds.length) {
    return resolveTargetTypeTargets(state, actor, targetType);
  }

  const targets = normalizedTargetIds
    .map(targetId => locateUnit(state, targetId))
    .filter((item): item is UnitLocator => !!item)
    .filter(item => isTargetLegal(actor, item, targetType));
  if (!targets.length) return resolveTargetTypeTargets(state, actor, targetType);

  if (targets.length !== 1) return [];
  return [targets[0]];
}

function validatePhase(state: BattleState): boolean {
  return state.当前阶段 === 'select_action';
}

export function validatePendingCommand(
  data: StatData,
  state: BattleState,
  command: PendingCommand,
): CommandValidationResult {
  const actor = locateUnit(state, command.actorId);
  if (!actor) {
    return { ok: false, reason: '行动者不存在。' };
  }

  if (state.当前行动单位Id !== actor.unit.unitId) {
    return { ok: false, reason: '当前不是该单位的行动时机。' };
  }

  if (!validatePhase(state)) {
    return { ok: false, reason: '当前阶段不允许提交行动。' };
  }

  if (!canAct(actor.unit)) {
    return { ok: false, reason: `${actor.unit.名字} 当前无法执行行动。` };
  }

  if (command.actionType === 'escape') {
    if (actor.side !== 'ally') {
      return { ok: false, reason: '只有我方单位可以尝试逃跑。' };
    }

    return {
      ok: true,
      context: {
        actor,
        command: { ...command, targetIds: undefined },
        targets: [],
      },
    };
  }

  if (command.actionType === 'defend') {
    return {
      ok: true,
      context: {
        actor,
        command: { ...command, targetIds: undefined },
        targets: [],
      },
    };
  }

  if (command.actionType === 'item') {
    const item = command.itemId ? data.背包[command.itemId] : undefined;
    if (!item) {
      return { ok: false, reason: '指定的道具不存在。' };
    }
    if (item.数量 <= 0 || !item.战斗可用) {
      return { ok: false, reason: `${item.名称} 当前不可在战斗中使用。` };
    }

    const itemTargetType = item.目标类型 ?? 'self';
    const targets = resolveTargets(state, actor, itemTargetType, command.targetIds);
    if (!targets.length) {
      return { ok: false, reason: `${item.名称} 没有合法目标。` };
    }

    return {
      ok: true,
      context: {
        actor,
        item,
        command: { ...command, targetIds: targets.map(target => target.unit.unitId) },
        targets,
      },
    };
  }

  const skill = command.skillId ? data.技能定义表[command.skillId] : chooseDefaultSkill(data, actor.unit);
  const runtimeSkill = getRuntimeSkill(actor.unit, skill?.id);
  if (!skill || !runtimeSkill) {
    return { ok: false, reason: `${actor.unit.名字} 没有可用技能。` };
  }
  if (runtimeSkill.当前冷却 > 0 || runtimeSkill.已禁用) {
    return { ok: false, reason: `${skill.名称} 目前无法使用。` };
  }
  const isSilenced = actor.unit.状态列表.some(s => s.statusId === 'silence' && s.剩余回合 > 0);
  if (isSilenced && skill.消耗.MP > 0) {
    return { ok: false, reason: `${actor.unit.名字} 处于沉默状态，无法使用消耗法力的技能。` };
  }
  if (actor.unit.当前资源.MP < skill.消耗.MP || actor.unit.当前资源.HP <= skill.消耗.HP) {
    return { ok: false, reason: `${actor.unit.名字} 的资源不足，无法施放 ${skill.名称}。` };
  }

  const taunt = actor.unit.状态列表.find(s => s.statusId === 'taunt' && s.剩余回合 > 0);
  const effectiveTargetIds = taunt?.来源单位Id ? [taunt.来源单位Id] : command.targetIds;
  const targets = resolveTargets(state, actor, skill.目标类型, effectiveTargetIds);
  if (!targets.length) {
    return { ok: false, reason: `${skill.名称} 没有合法目标。` };
  }

  return {
    ok: true,
    context: {
      actor,
      skill,
      runtimeSkill,
      command: {
        ...command,
        skillId: skill.id,
        targetIds: targets.map(target => target.unit.unitId),
      },
      targets,
    },
  };
}
