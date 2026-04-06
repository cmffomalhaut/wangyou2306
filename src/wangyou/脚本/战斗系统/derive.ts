import type { BattleUnitState, CharacterRecord, RuntimeSkillState, SideKey } from './types';

function clamp(value: number, min: number, max: number): number {
  return _.clamp(value, min, max);
}

export const DERIVE_FORMULA_SOURCES = {
  HP: '角色档案.资源.生命值，运行时按 [0, 最大值] 钳制并初始化护盾为 0',
  MP: '角色档案.资源.法力值，运行时按 [0, 最大值] 钳制',
  生命层次: '1 + floor((等级 - 1) / 生命层次等级跨度)',
  六项成长加成: 'max(0, 生命层次 - 1)，加到 力量/敏捷/体质/智力/感知/魅力，不加幸运',
  先攻: '敏捷',
  物理防御: '10 + 体质 + floor(等级 / 2)',
  精神防御: '10 + 感知 + floor(等级 / 2)',
  命中加值: 'floor(敏捷 / 3)',
  闪避加值: 'floor(敏捷 / 3)',
  治疗强度: 'floor(感知 / 2)',
} as const;

export function getLifeTier(level: number, tierSpan = 4): number {
  return Math.max(1, 1 + Math.floor((Math.max(1, level) - 1) / Math.max(1, tierSpan)));
}

export function buildRuntimeSkill(skillId: string): RuntimeSkillState {
  return {
    skillId,
    当前冷却: 0,
    已禁用: false,
  };
}

export function deriveUnitResources(record: CharacterRecord): BattleUnitState['当前资源'] {
  const hpMax = Math.max(1, record.资源.生命值.最大值);
  const mpMax = Math.max(0, record.资源.法力值.最大值);

  return {
    HP: clamp(record.资源.生命值.当前值, 0, hpMax),
    HPMax: hpMax,
    MP: clamp(record.资源.法力值.当前值, 0, mpMax),
    MPMax: mpMax,
    Shield: 0,
  };
}

export function deriveUnitAttributes(record: CharacterRecord): BattleUnitState['当前属性'] {
  const lifeTier = getLifeTier(record.等级);
  const lifeTierBonus = Math.max(0, lifeTier - 1);
  const 力量 = record.七维.力量 + lifeTierBonus;
  const 敏捷 = record.七维.敏捷 + lifeTierBonus;
  const 体质 = record.七维.体质 + lifeTierBonus;
  const 智力 = record.七维.智力 + lifeTierBonus;
  const 感知 = record.七维.感知 + lifeTierBonus;
  const 魅力 = record.七维.魅力 + lifeTierBonus;
  const 幸运 = record.七维.幸运;

  return {
    力量,
    敏捷,
    体质,
    智力,
    感知,
    魅力,
    幸运,
    护甲等级: record.派生基线.护甲等级,
    物理防御: 10 + 体质 + Math.floor(record.等级 / 2),
    精神防御: 10 + 感知 + Math.floor(record.等级 / 2),
    命中加值: Math.floor(敏捷 / 3),
    闪避加值: Math.floor(敏捷 / 3),
    先攻: 敏捷,
    生命层次: lifeTier,
    异常抗性: record.派生基线.异常抗性,
    控制强度: record.派生基线.控制强度,
    治疗强度: Math.floor(感知 / 2),
  };
}

export function deriveUnit(record: CharacterRecord, side: SideKey): BattleUnitState {
  const resources = deriveUnitResources(record);

  return {
    unitId: `${record.id}__${side}`,
    sourceCharacterId: record.id,
    名字: record.名字,
    阵营: side,
    是否存活: resources.HP > 0,
    是否可行动: resources.HP > 0,
    当前资源: resources,
    当前属性: deriveUnitAttributes(record),
    技能栏: record.技能表.filter(skill => skill.已装备 && skill.已解锁).map(skill => buildRuntimeSkill(skill.skillId)),
    状态列表: [],
    修正器列表: [],
    标记: {
      防御中: false,
      已用反应: false,
      本回合已行动: false,
    },
  };
}
