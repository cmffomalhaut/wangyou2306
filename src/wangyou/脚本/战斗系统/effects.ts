import type {
  BattleLogEntry,
  BattleState,
  BattleUnitState,
  RuleConfig,
  RuntimeModifierState,
  RuntimeStatusState,
  SkillDefinition,
} from './types';

function clamp(value: number, min: number, max: number): number {
  return _.clamp(value, min, max);
}

export function refreshUnitAvailability(unit: BattleUnitState): void {
  const hasControlLock = unit.状态列表.some(
    status => ['stun', 'freeze'].includes(status.statusId) && status.剩余回合 > 0,
  );
  unit.是否存活 = unit.当前资源.HP > 0;
  unit.是否可行动 = unit.是否存活 && !hasControlLock;
  if (!unit.是否存活) {
    unit.标记.防御中 = false;
  }
}

export function applyStatus(
  unit: BattleUnitState,
  statusId: string,
  duration: number,
  sourceUnitId?: string,
  power?: number,
): RuntimeStatusState {
  const existing = unit.状态列表.find(status => status.statusId === statusId && status.来源单位Id === sourceUnitId);
  if (existing) {
    existing.剩余回合 = Math.max(existing.剩余回合, duration);
    existing.层数 += 1;
    if (power !== undefined) {
      existing.强度 = Math.max(existing.强度 ?? 0, power);
    }
    return existing;
  }

  const categoryMap: Record<string, RuntimeStatusState['分类']> = {
    burn: 'dot',
    poison: 'dot',
    bleed: 'dot',
    stun: 'control',
    freeze: 'control',
    silence: 'control',
    fear: 'mental',
    confuse: 'mental',
    charm: 'mental',
    taunt: 'mental',
  };

  const nameMap: Record<string, string> = {
    burn: '灼烧',
    poison: '中毒',
    bleed: '流血',
    stun: '眩晕',
    freeze: '冻结',
    silence: '沉默',
    fear: '恐惧',
    confuse: '混乱',
    charm: '魅惑',
    taunt: '嘲讽',
  };

  const created: RuntimeStatusState = {
    statusId,
    名称: nameMap[statusId] ?? statusId,
    分类: categoryMap[statusId] ?? 'special',
    来源单位Id: sourceUnitId,
    层数: 1,
    剩余回合: duration,
    强度: power,
    标签: [statusId],
  };
  unit.状态列表.push(created);
  refreshUnitAvailability(unit);
  return created;
}

export function applyModifier(
  unit: BattleUnitState,
  modifierId: string,
  value: number,
  duration: number,
  sourceUnitId?: string,
): RuntimeModifierState {
  const modifierNameMap: Record<string, RuntimeModifierState['目标属性']> = {
    attack_up: '力量',
    dexterity_up: '敏捷',
    wisdom_up: '感知',
    charisma_up: '魅力',
    constitution_up: '体质',
    intelligence_up: '智力',
    luck_up: '幸运',
    armor_up: '护甲等级',
  };

  const target = modifierNameMap[modifierId] ?? '力量';
  const created: RuntimeModifierState = {
    modifierId,
    名称: modifierId,
    目标属性: target,
    类型: value >= 0 ? 'buff' : 'debuff',
    叠加方式: 'replace',
    数值: value,
    剩余回合: duration,
    来源单位Id: sourceUnitId,
  };

  const existingIndex = unit.修正器列表.findIndex(
    item => item.modifierId === modifierId && item.来源单位Id === sourceUnitId,
  );
  if (existingIndex >= 0) {
    unit.修正器列表[existingIndex] = created;
  } else {
    unit.修正器列表.push(created);
  }
  return created;
}

export function applyModifierStats(unit: BattleUnitState): void {
  const base = unit.当前属性;
  const next = { ...base };
  unit.修正器列表.forEach(modifier => {
    if (modifier.目标属性 in next) {
      next[modifier.目标属性] += modifier.数值;
    }
  });
  unit.当前属性 = next;
}

function calcDamage(
  actor: BattleUnitState,
  target: BattleUnitState,
  effect: SkillDefinition['效果列表'][number] & { kind: 'damage' },
  rules: RuleConfig,
): number {
  const scaleValue = actor.当前属性[effect.scale];
  const base = scaleValue * effect.ratio + effect.flat;
  const defense =
    effect.damageType === 'fire' || effect.damageType === 'arcane'
      ? target.当前属性.精神防御
      : target.当前属性.物理防御;
  const defendingFactor = target.标记.防御中 ? 0.6 : 1;
  const tierDelta = actor.当前属性.生命层次 - target.当前属性.生命层次;
  const tierFactor = 1 + tierDelta * (rules.数值规则.生命层次伤害修正 ?? 0.1);
  return Math.max(1, Math.floor((base - defense * 0.35) * defendingFactor * Math.max(0.4, tierFactor)));
}

function calcHeal(
  actor: BattleUnitState,
  target: BattleUnitState,
  effect: SkillDefinition['效果列表'][number] & { kind: 'heal' },
): number {
  const amount = Math.max(
    1,
    Math.floor(actor.当前属性[effect.scale] * effect.ratio + effect.flat + actor.当前属性.治疗强度),
  );
  const before = target.当前资源.HP;
  target.当前资源.HP = clamp(target.当前资源.HP + amount, 0, target.当前资源.HPMax);
  return target.当前资源.HP - before;
}

type CreateLog = (
  state: BattleState,
  type: BattleLogEntry['type'],
  text: string,
  extra?: Partial<BattleLogEntry>,
) => BattleLogEntry;


export type EffectListArgs = {
  state: BattleState;
  actor: BattleUnitState;
  target: BattleUnitState;
  effects: SkillDefinition['效果列表'];
  skillId?: string;
  rules: RuleConfig;
  createLog: CreateLog;
  halfDamage?: boolean;
};

export function applyEffectList({ state, actor, target, effects, skillId, rules, createLog, halfDamage }: EffectListArgs): BattleLogEntry[] {
  const logs: BattleLogEntry[] = [];

  effects.forEach(effect => {
    if (halfDamage && effect.kind !== 'damage') return;
    if (effect.kind === 'damage') {
      let damage = calcDamage(actor, target, effect, rules);
      if (halfDamage) damage = Math.max(1, Math.floor(damage / 2));
      const shieldDamage = Math.min(target.当前资源.Shield, damage);
      target.当前资源.Shield -= shieldDamage;
      const hpDamage = Math.min(target.当前资源.HP, damage - shieldDamage);
      target.当前资源.HP -= hpDamage;
      logs.push(
        createLog(state, 'damage', `${target.名字} 受到 ${damage} 点伤害。`, {
          actorId: actor.unitId,
          targetId: target.unitId,
          skillId: skillId,
        }),
      );
    }
    if (effect.kind === 'heal') {
      const heal = calcHeal(actor, target, effect);
      logs.push(
        createLog(state, 'heal', `${target.名字} 恢复了 ${heal} 点生命。`, {
          actorId: actor.unitId,
          targetId: target.unitId,
          skillId: skillId,
        }),
      );
    }
    if (effect.kind === 'restore_mp') {
      const before = target.当前资源.MP;
      const amount = Math.max(1, Math.floor(effect.flat + (effect.ratio ?? 0) * actor.当前属性.智力));
      target.当前资源.MP = clamp(target.当前资源.MP + amount, 0, target.当前资源.MPMax);
      const delta = target.当前资源.MP - before;
      if (delta > 0) {
        logs.push(
          createLog(state, 'resource', `${target.名字} 恢复了 ${delta} 点法力。`, {
            actorId: actor.unitId,
            targetId: target.unitId,
            skillId: skillId,
          }),
        );
      }
    }
    if (effect.kind === 'shield') {
      const amount = Math.max(1, Math.floor(actor.当前属性[effect.scale] * effect.ratio + effect.flat));
      target.当前资源.Shield += amount;
      logs.push(
        createLog(state, 'resource', `${target.名字} 获得了 ${amount} 点护盾。`, {
          actorId: actor.unitId,
          targetId: target.unitId,
          skillId: skillId,
        }),
      );
    }
    if (effect.kind === 'apply_status') {
      const luckShift = Math.max(-0.15, Math.min(0.15, (actor.当前属性.幸运 - target.当前属性.幸运) * 0.01));
      const controlShift = actor.当前属性.控制强度 * 0.01 - target.当前属性.异常抗性 * 0.01;
      const finalChance = _.clamp(effect.chance + luckShift + controlShift, 0, 1);
      if (Math.random() <= finalChance) {
        const status = applyStatus(target, effect.statusId, effect.duration, actor.unitId, effect.power);
        logs.push(
          createLog(state, 'status_apply', `${target.名字} 附加了 ${status.名称}。`, {
            actorId: actor.unitId,
            targetId: target.unitId,
            skillId: skillId,
            payload: { statusMeta: { statusId: effect.statusId, duration: effect.duration, chance: finalChance, applied: true } },
          }),
        );
      } else {
        logs.push(
          createLog(state, 'status_apply', `${target.名字} 抵抗了 ${effect.statusId}。`, {
            actorId: actor.unitId,
            targetId: target.unitId,
            skillId: skillId,
            payload: { statusMeta: { statusId: effect.statusId, duration: effect.duration, chance: finalChance, applied: false } },
          }),
        );
      }
    }
    if (effect.kind === 'remove_status') {
      const before = target.状态列表.length;
      target.状态列表 = target.状态列表
        .filter(status => !status.标签.some(tag => effect.removeTags.includes(tag)))
        .slice(0, Math.max(0, before - effect.count));
      logs.push(
        createLog(state, 'status_remove', `${target.名字} 的异常状态被净化。`, {
          actorId: actor.unitId,
          targetId: target.unitId,
          skillId: skillId,
        }),
      );
    }
    if (effect.kind === 'add_modifier') {
      const modifier = applyModifier(target, effect.modifierId, effect.value, effect.duration, actor.unitId);
      logs.push(
        createLog(state, 'modifier_apply', `${target.名字} 获得修正 ${modifier.modifierId}。`, {
          actorId: actor.unitId,
          targetId: target.unitId,
          skillId: skillId,
        }),
      );
    }
    if (effect.kind === 'taunt') {
      applyStatus(target, 'taunt', effect.duration, actor.unitId, effect.dc);
      logs.push(
        createLog(state, 'status_apply', `${target.名字} 被嘲讽。`, {
          actorId: actor.unitId,
          targetId: target.unitId,
          skillId: skillId,
        }),
      );
    }
    if (effect.kind === 'modify_counter') {
      target.行动计数器 = Math.max(1, target.行动计数器 + effect.flat);
      const dir = effect.flat < 0 ? '加速' : '减速';
      logs.push(
        createLog(state, 'system', `${target.名字} 的行动计数器${dir}了 ${Math.abs(effect.flat)}。`, {
          actorId: actor.unitId,
          targetId: target.unitId,
          skillId: skillId,
        }),
      );
    }
    refreshUnitAvailability(target);
  });

  return logs;
}

type ApplySkillEffectsArgs = {
  state: BattleState;
  actor: BattleUnitState;
  target: BattleUnitState;
  skill: SkillDefinition;
  rules: RuleConfig;
  createLog: CreateLog;
  halfDamage?: boolean;
};

export function applySkillEffects({ state, actor, target, skill, rules, createLog, halfDamage }: ApplySkillEffectsArgs): BattleLogEntry[] {
  return applyEffectList({ state, actor, target, effects: skill.效果列表, skillId: skill.id, rules, createLog, halfDamage });
}
