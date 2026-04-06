import type { BattleUnitState, RollResult, RuleConfig, SkillDefinition } from './types';

function getDefenseValue(target: BattleUnitState, key: SkillDefinition['检定']['对抗防御'] | undefined): number {
  if (key === '物理防御') return target.当前属性.物理防御;
  if (key === '精神防御') return target.当前属性.精神防御;
  return target.当前属性.护甲等级;
}

function getAttribute(
  unit: BattleUnitState,
  key: SkillDefinition['检定']['攻击属性'] | SkillDefinition['检定']['豁免属性'] | undefined,
): number {
  if (!key) return 0;
  return unit.当前属性[key];
}

export function rollD20(modifier: number, options?: { advantage?: boolean; disadvantage?: boolean }): RollResult {
  let rawRolls = [_.random(1, 20)];
  if (options?.advantage || options?.disadvantage) {
    rawRolls = [_.random(1, 20), _.random(1, 20)];
  }

  let finalRoll = rawRolls[0];
  if (rawRolls.length === 2) {
    finalRoll = options?.advantage ? Math.max(...rawRolls) : Math.min(...rawRolls);
  }

  return {
    rollType: 'attack',
    actorId: '',
    dice: rawRolls.length === 2 ? (options?.advantage ? '2d20kh1' : '2d20kl1') : '1d20',
    rawRolls,
    finalRoll: finalRoll + modifier,
    modifier,
    success: false,
    isCriticalSuccess: finalRoll === 20,
    isCriticalFail: finalRoll === 1,
  };
}

export function resolveAttackCheck(
  actor: BattleUnitState,
  target: BattleUnitState,
  skill: SkillDefinition,
): RollResult {
  const modifier = getAttribute(actor, skill.检定.攻击属性) + (skill.检定.命中加值 ?? 0) + actor.当前属性.命中加值;
  const roll = rollD20(modifier, { advantage: skill.检定.优势, disadvantage: skill.检定.劣势 });
  roll.actorId = actor.unitId;
  roll.targetId = target.unitId;
  roll.targetAC = getDefenseValue(target, skill.检定.对抗防御);
  roll.success = roll.isCriticalSuccess || (!roll.isCriticalFail && roll.finalRoll >= (roll.targetAC ?? 10));
  return roll;
}

export function resolveSavingThrow(
  actor: BattleUnitState,
  target: BattleUnitState,
  skill: SkillDefinition,
): RollResult {
  const modifier = getAttribute(target, skill.检定.豁免属性);
  const raw = _.random(1, 20);
  const dc = skill.检定.基础DC ?? 10 + getAttribute(actor, skill.检定.攻击属性);
  return {
    rollType: 'save',
    actorId: actor.unitId,
    targetId: target.unitId,
    dice: '1d20',
    rawRolls: [raw],
    finalRoll: raw + modifier,
    modifier,
    dc,
    success: raw !== 1 && (raw === 20 || raw + modifier >= dc),
    isCriticalSuccess: raw === 20,
    isCriticalFail: raw === 1,
  };
}

export function resolveEscapeAction(actor: BattleUnitState, rules: RuleConfig): RollResult {
  const modifier = actor.当前属性.先攻 + actor.当前属性.魅力;
  const raw = _.random(1, 20);
  return {
    rollType: 'escape',
    actorId: actor.unitId,
    dice: '1d20',
    rawRolls: [raw],
    finalRoll: raw + modifier,
    modifier,
    dc: rules.资源规则.逃跑基础DC,
    success: raw !== 1 && (raw === 20 || raw + modifier >= rules.资源规则.逃跑基础DC),
    isCriticalSuccess: raw === 20,
    isCriticalFail: raw === 1,
  };
}
