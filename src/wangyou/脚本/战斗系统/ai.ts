import { getRuntimeSkill } from './commands';
import type {
  BattleState,
  BattleUnitState,
  PendingCommand,
  SideKey,
  SkillDefinition,
  StatData,
  UnitLocator,
} from './types';

function getOppositeSide(side: SideKey): SideKey {
  return side === 'ally' ? 'enemy' : 'ally';
}

function locateUnitsBySide(state: BattleState, side: SideKey): BattleUnitState[] {
  return state.参战方[side].单位列表.filter(unit => unit.是否存活);
}

function getHpRatio(unit: BattleUnitState): number {
  return unit.当前资源.HPMax > 0 ? unit.当前资源.HP / unit.当前资源.HPMax : 0;
}

function canUseSkill(data: StatData, actor: BattleUnitState, skill: SkillDefinition): boolean {
  const runtimeSkill = getRuntimeSkill(actor, skill.id);
  if (!runtimeSkill || runtimeSkill.当前冷却 > 0 || runtimeSkill.已禁用) {
    return false;
  }

  return actor.当前资源.MP >= skill.消耗.MP && actor.当前资源.HP > skill.消耗.HP;
}

function getUsableSkills(data: StatData, actor: BattleUnitState): SkillDefinition[] {
  return actor.技能栏
    .map(runtimeSkill => data.技能定义表[runtimeSkill.skillId])
    .filter((skill): skill is SkillDefinition => !!skill)
    .filter(skill => canUseSkill(data, actor, skill));
}

function hasControlStatus(unit: BattleUnitState): boolean {
  return unit.状态列表.some(status =>
    ['stun', 'freeze', 'silence', 'fear', 'confuse', 'charm', 'taunt'].includes(status.statusId),
  );
}

function isSupportSkill(skill: SkillDefinition): boolean {
  return skill.效果列表.some(effect => ['heal', 'shield', 'restore_mp', 'add_modifier'].includes(effect.kind));
}

function isControlSkill(skill: SkillDefinition): boolean {
  return skill.效果列表.some(effect => effect.kind === 'apply_status' || effect.kind === 'taunt');
}

function scoreSkill(
  skill: SkillDefinition,
  actor: BattleUnitState,
  allies: BattleUnitState[],
  enemies: BattleUnitState[],
): number {
  const hpRatio = getHpRatio(actor);
  const lowestAllyHpRatio = allies.length ? Math.min(...allies.map(getHpRatio)) : 1;
  const lowestEnemyHpRatio = enemies.length ? Math.min(...enemies.map(getHpRatio)) : 1;
  const uncontrolledEnemies = enemies.filter(unit => !hasControlStatus(unit)).length;
  let score = 10;

  if (skill.消耗.MP > 0) {
    score -= skill.消耗.MP * 0.5;
  }
  if (skill.消耗.冷却回合 > 0) {
    score += 2;
  }

  switch (skill.AI约束.使用倾向) {
    case 'survive':
      score += hpRatio <= 0.45 ? 24 : hpRatio <= 0.7 ? 10 : -4;
      break;
    case 'support':
      score += lowestAllyHpRatio <= 0.5 ? 20 : lowestAllyHpRatio <= 0.75 ? 8 : -3;
      break;
    case 'control':
      score += uncontrolledEnemies > 0 ? 18 : -6;
      break;
    case 'burst':
      score += lowestEnemyHpRatio <= 0.45 ? 16 : 7;
      break;
    case 'attack':
    default:
      score += 8;
      break;
  }

  if (skill.目标类型 === 'self' && hpRatio > 0.85 && isSupportSkill(skill)) {
    score -= 10;
  }

  if (skill.目标类型 === 'single_ally' && !isSupportSkill(skill)) {
    score -= 6;
  }

  if (skill.目标类型 === 'single_enemy' && isControlSkill(skill) && uncontrolledEnemies <= 0) {
    score -= 10;
  }

  return score;
}

function chooseSingleEnemyTarget(
  skill: SkillDefinition,
  actorSide: SideKey,
  enemies: BattleUnitState[],
): BattleUnitState | undefined {
  const sorted = [...enemies].sort((left, right) => getHpRatio(left) - getHpRatio(right));
  if (!sorted.length) return undefined;

  if (skill.AI约束.使用倾向 === 'control') {
    return sorted.find(unit => !hasControlStatus(unit)) ?? sorted[0];
  }

  if (skill.AI约束.使用倾向 === 'burst' || skill.AI约束.使用倾向 === 'attack') {
    return sorted[0];
  }

  return actorSide === 'enemy' ? sorted[0] : sorted[sorted.length - 1];
}

function chooseSingleAllyTarget(
  skill: SkillDefinition,
  actor: BattleUnitState,
  allies: BattleUnitState[],
): BattleUnitState | undefined {
  if (skill.目标类型 === 'self') {
    return actor;
  }

  const sorted = [...allies].sort((left, right) => getHpRatio(left) - getHpRatio(right));
  if (!sorted.length) return undefined;

  if (skill.AI约束.使用倾向 === 'survive') {
    return actor;
  }

  return sorted[0];
}

function buildTargetIds(skill: SkillDefinition, actor: UnitLocator, state: BattleState): string[] | undefined {
  const allies = locateUnitsBySide(state, actor.side);
  const enemies = locateUnitsBySide(state, getOppositeSide(actor.side));

  switch (skill.目标类型) {
    case 'self':
      return [actor.unit.unitId];
    case 'single_ally': {
      const target = chooseSingleAllyTarget(skill, actor.unit, allies);
      return target ? [target.unitId] : undefined;
    }
    case 'all_allies':
      return allies.map(unit => unit.unitId);
    case 'all_enemies':
      return enemies.map(unit => unit.unitId);
    case 'random_enemy': {
      if (!enemies.length) return undefined;
      const target = enemies[_.random(0, enemies.length - 1)];
      return [target.unitId];
    }
    case 'single_enemy':
    default: {
      const target = chooseSingleEnemyTarget(skill, actor.side, enemies);
      return target ? [target.unitId] : undefined;
    }
  }
}

export function generateEnemyCommand(data: StatData, state: BattleState, actor: UnitLocator): PendingCommand {
  const allies = locateUnitsBySide(state, actor.side);
  const enemies = locateUnitsBySide(state, getOppositeSide(actor.side));
  const usableSkills = getUsableSkills(data, actor.unit);

  if (!enemies.length) {
    return {
      actorId: actor.unit.unitId,
      actionType: 'defend',
      clientHint: { source: 'enemy_ai' },
    };
  }

  const rankedSkills = usableSkills
    .map(skill => ({ skill, score: scoreSkill(skill, actor.unit, allies, enemies) }))
    .sort((left, right) => right.score - left.score);

  const pickedSkill = rankedSkills[0]?.skill;
  if (!pickedSkill) {
    return {
      actorId: actor.unit.unitId,
      actionType: getHpRatio(actor.unit) <= 0.3 ? 'defend' : 'skill',
      skillId: actor.unit.技能栏[0]?.skillId,
      targetIds: enemies[0] ? [enemies[0].unitId] : undefined,
      clientHint: { source: 'enemy_ai' },
    };
  }

  return {
    actorId: actor.unit.unitId,
    actionType: 'skill',
    skillId: pickedSkill.id,
    targetIds: buildTargetIds(pickedSkill, actor, state),
    clientHint: { source: 'enemy_ai' },
  };
}
