// ═══════════════════════════════════════════════════════════════
//  硬编码数据库 —— 技能、怪物、遭遇组、规则配置
//  简单卡不需要在 MVU 里存这些，引擎脚本自带。
// ═══════════════════════════════════════════════════════════════

import type { SkillDefinition } from '../wangyou/脚本/战斗系统/types';
import type { MonsterTemplate, EncounterGroup } from '../wangyou/脚本/战斗系统/monsters';

// ────────────────────────────────────────────
//  技能数据库
// ────────────────────────────────────────────

export const SKILL_DB: Record<string, SkillDefinition> = {
  // ── 主角用 ──

  basic_attack: {
    id: 'basic_attack',
    名称: '普攻',
    类型: '主动',
    标签: ['physical'],
    描述: '用武器进行一次普通攻击。',
    目标类型: 'single_enemy',
    射程: 'melee',
    消耗: { MP: 0, HP: 0, 冷却回合: 0, 行动点: 1 },
    检定: { 类型: 'attack_roll', 攻击属性: '力量', 对抗防御: '护甲等级' },
    效果列表: [{ kind: 'damage', scale: '力量', ratio: 1.0, flat: 0, damageType: 'physical' }],
    AI约束: { 使用倾向: 'attack', 推荐时机: '常规回合' },
  },

  poison_strike: {
    id: 'poison_strike',
    名称: '毒刃',
    类型: '主动',
    标签: ['physical', 'debuff'],
    描述: '以涂毒武器攻击敌人，有概率使其中毒。',
    目标类型: 'single_enemy',
    射程: 'melee',
    消耗: { MP: 3, HP: 0, 冷却回合: 0, 行动点: 1 },
    检定: { 类型: 'attack_roll', 攻击属性: '敏捷', 对抗防御: '护甲等级' },
    效果列表: [
      { kind: 'damage', scale: '敏捷', ratio: 0.8, flat: 0, damageType: 'physical' },
      { kind: 'apply_status', statusId: 'poison', chance: 0.7, duration: 3, power: 3 },
    ],
    AI约束: { 使用倾向: 'attack', 推荐时机: '常规回合' },
  },

  fire_bolt: {
    id: 'fire_bolt',
    名称: '火球术',
    类型: '主动',
    标签: ['magic'],
    描述: '发射一枚火球，造成魔法火焰伤害。',
    目标类型: 'single_enemy',
    射程: 'ranged',
    消耗: { MP: 5, HP: 0, 冷却回合: 0, 行动点: 1 },
    检定: { 类型: 'attack_roll', 攻击属性: '智力', 对抗防御: '精神防御' },
    效果列表: [{ kind: 'damage', scale: '智力', ratio: 1.5, flat: 0, damageType: 'fire' }],
    AI约束: { 使用倾向: 'burst', 推荐时机: '常规回合' },
  },

  multi_shot: {
    id: 'multi_shot',
    名称: '多重射击',
    类型: '主动',
    标签: ['physical'],
    描述: '快速射击多个目标，攻击全体敌人。',
    目标类型: 'all_enemies',
    射程: 'ranged',
    消耗: { MP: 6, HP: 0, 冷却回合: 1, 行动点: 1 },
    检定: { 类型: 'attack_roll', 攻击属性: '敏捷', 对抗防御: '护甲等级' },
    效果列表: [{ kind: 'damage', scale: '敏捷', ratio: 0.7, flat: 0, damageType: 'physical' }],
    AI约束: { 使用倾向: 'burst', 推荐时机: '敌方人数≥2' },
  },

  fear_howl: {
    id: 'fear_howl',
    名称: '恐惧嚎叫',
    类型: '主动',
    标签: ['magic', 'control'],
    描述: '发出令人恐惧的嚎叫，有概率使全体敌人陷入恐惧。',
    目标类型: 'all_enemies',
    射程: 'global',
    消耗: { MP: 8, HP: 0, 冷却回合: 2, 行动点: 1 },
    检定: { 类型: 'saving_throw', 豁免属性: '感知', 基础DC: 12 },
    效果列表: [{ kind: 'apply_status', statusId: 'fear', chance: 0.6, duration: 2 }],
    AI约束: { 使用倾向: 'control', 推荐时机: '敌方人数≥2' },
  },

  mass_shield: {
    id: 'mass_shield',
    名称: '群体护盾',
    类型: '主动',
    标签: ['magic', 'support'],
    描述: '为全体友方附加魔法护盾，吸收伤害。',
    目标类型: 'all_allies',
    射程: 'global',
    消耗: { MP: 8, HP: 0, 冷却回合: 2, 行动点: 1 },
    检定: { 类型: 'auto_hit' },
    效果列表: [{ kind: 'shield', scale: '智力', ratio: 0.5, flat: 2, duration: 3 }],
    AI约束: { 使用倾向: 'support', 推荐时机: '敌方人数≥2' },
  },

  heal: {
    id: 'heal',
    名称: '治疗',
    类型: '主动',
    标签: ['heal'],
    描述: '恢复一名友方单位的生命值。',
    目标类型: 'single_ally',
    射程: 'ranged',
    消耗: { MP: 4, HP: 0, 冷却回合: 0, 行动点: 1 },
    检定: { 类型: 'auto_hit' },
    效果列表: [{ kind: 'heal', scale: '感知', ratio: 1.2, flat: 2 }],
    AI约束: { 使用倾向: 'survive', 推荐时机: 'HP<60%' },
  },

  mass_heal: {
    id: 'mass_heal',
    名称: '群体治疗',
    类型: '主动',
    标签: ['heal'],
    描述: '恢复全体友方单位的生命值。',
    目标类型: 'all_allies',
    射程: 'global',
    消耗: { MP: 10, HP: 0, 冷却回合: 2, 行动点: 1 },
    检定: { 类型: 'auto_hit' },
    效果列表: [{ kind: 'heal', scale: '感知', ratio: 0.6, flat: 1 }],
    AI约束: { 使用倾向: 'support', 推荐时机: '多人HP<60%' },
  },

  haste: {
    id: 'haste',
    名称: '加速',
    类型: '主动',
    标签: ['buff'],
    描述: '加快一名友方的行动速度，使其更快获得下一回合。',
    目标类型: 'single_ally',
    射程: 'ranged',
    消耗: { MP: 4, HP: 0, 冷却回合: 1, 行动点: 1 },
    检定: { 类型: 'auto_hit' },
    效果列表: [{ kind: 'modify_counter', flat: -30 }],
    AI约束: { 使用倾向: 'support', 推荐时机: '常规回合' },
  },

  slow: {
    id: 'slow',
    名称: '减速',
    类型: '主动',
    标签: ['magic', 'debuff'],
    描述: '减缓一名敌人的行动速度，使其行动延后。',
    目标类型: 'single_enemy',
    射程: 'ranged',
    消耗: { MP: 4, HP: 0, 冷却回合: 1, 行动点: 1 },
    检定: { 类型: 'saving_throw', 豁免属性: '敏捷', 基础DC: 12 },
    效果列表: [{ kind: 'modify_counter', flat: 30 }],
    AI约束: { 使用倾向: 'control', 推荐时机: '常规回合' },
  },

  // ── 怪物用 ──

  acid_spit: {
    id: 'acid_spit',
    名称: '酸液喷射',
    类型: '主动',
    标签: ['magic', 'debuff'],
    描述: '喷出一团腐蚀性酸液，有概率使目标中毒。',
    目标类型: 'single_enemy',
    射程: 'ranged',
    消耗: { MP: 3, HP: 0, 冷却回合: 1, 行动点: 1 },
    检定: { 类型: 'attack_roll', 攻击属性: '智力', 对抗防御: '精神防御' },
    效果列表: [
      { kind: 'damage', scale: '智力', ratio: 0.6, flat: 2, damageType: 'acid' },
      { kind: 'apply_status', statusId: 'poison', chance: 0.5, duration: 3, power: 2 },
    ],
    AI约束: { 使用倾向: 'attack', 推荐时机: '常规回合' },
  },

  charge: {
    id: 'charge',
    名称: '冲锋',
    类型: '主动',
    标签: ['physical'],
    描述: '全力冲撞目标，同时提升自身攻击力。',
    目标类型: 'single_enemy',
    射程: 'melee',
    消耗: { MP: 0, HP: 0, 冷却回合: 2, 行动点: 1 },
    检定: { 类型: 'attack_roll', 攻击属性: '力量', 对抗防御: '护甲等级' },
    效果列表: [
      { kind: 'damage', scale: '力量', ratio: 1.2, flat: 3, damageType: 'physical' },
      { kind: 'add_modifier', modifierId: 'attack_up', value: 3, duration: 2 },
    ],
    AI约束: { 使用倾向: 'attack', 推荐时机: '常规回合' },
  },

  bite: {
    id: 'bite',
    名称: '撕咬',
    类型: '主动',
    标签: ['physical'],
    描述: '用利齿撕咬目标，有概率造成持续流血。',
    目标类型: 'single_enemy',
    射程: 'melee',
    消耗: { MP: 0, HP: 0, 冷却回合: 1, 行动点: 1 },
    检定: { 类型: 'attack_roll', 攻击属性: '敏捷', 对抗防御: '护甲等级' },
    效果列表: [
      { kind: 'damage', scale: '敏捷', ratio: 0.9, flat: 1, damageType: 'physical' },
      { kind: 'apply_status', statusId: 'bleed', chance: 0.6, duration: 3, power: 3 },
    ],
    AI约束: { 使用倾向: 'attack', 推荐时机: '常规回合' },
  },

  rock_throw: {
    id: 'rock_throw',
    名称: '投石',
    类型: '主动',
    标签: ['physical'],
    描述: '捡起石块投掷敌人，远程物理攻击。',
    目标类型: 'single_enemy',
    射程: 'ranged',
    消耗: { MP: 0, HP: 0, 冷却回合: 0, 行动点: 1 },
    检定: { 类型: 'attack_roll', 攻击属性: '敏捷', 对抗防御: '护甲等级' },
    效果列表: [{ kind: 'damage', scale: '敏捷', ratio: 0.7, flat: 2, damageType: 'physical' }],
    AI约束: { 使用倾向: 'attack', 推荐时机: '常规回合' },
  },
};

// ────────────────────────────────────────────
//  怪物数据库（全部 Lv1，新手级）
// ────────────────────────────────────────────

export const MONSTER_DB: Record<string, MonsterTemplate> = {
  slime: {
    id: 'slime',
    name: '史莱姆',
    level: 1,
    stats: { 力量: 3, 敏捷: 2, 体质: 4, 智力: 3, 感知: 2, 魅力: 1, 幸运: 2 },
    hp: 30,
    mp: 5,
    ac: 8,
    skills: [{ skillId: 'basic_attack', slotId: 's1' }, { skillId: 'acid_spit', slotId: 's2' }],
    tags: ['魔物'],
    description: '半透明的凝胶状生物，缓慢蠕动着。',
    job: '魔物',
    style: '酸液',
    damageBias: 'magic',
    loot: [{ itemId: 'potion_small', chance: 0.5, minCount: 1, maxCount: 1 }],
  },

  wild_boar: {
    id: 'wild_boar',
    name: '野猪',
    level: 1,
    stats: { 力量: 6, 敏捷: 3, 体质: 5, 智力: 2, 感知: 3, 魅力: 2, 幸运: 3 },
    hp: 50,
    mp: 0,
    ac: 10,
    skills: [{ skillId: 'basic_attack', slotId: 's1' }, { skillId: 'charge', slotId: 's2' }],
    tags: ['野兽'],
    description: '獠牙锋利的野猪，脾气暴躁，会不顾一切地冲撞。',
    job: '野兽',
    style: '冲撞',
    loot: [{ itemId: 'potion_small', chance: 0.4, minCount: 1, maxCount: 1 }],
  },

  forest_wolf: {
    id: 'forest_wolf',
    name: '森林狼',
    level: 1,
    stats: { 力量: 4, 敏捷: 6, 体质: 4, 智力: 2, 感知: 5, 魅力: 2, 幸运: 3 },
    hp: 40,
    mp: 0,
    ac: 9,
    skills: [{ skillId: 'basic_attack', slotId: 's1' }, { skillId: 'bite', slotId: 's2' }],
    tags: ['野兽'],
    description: '饥饿的森林狼，眼中泛着绿光，伺机而动。',
    job: '野兽',
    style: '扑咬',
    loot: [{ itemId: 'potion_small', chance: 0.35, minCount: 1, maxCount: 1 }],
  },

  goblin: {
    id: 'goblin',
    name: '哥布林',
    level: 1,
    stats: { 力量: 4, 敏捷: 5, 体质: 4, 智力: 3, 感知: 3, 魅力: 2, 幸运: 3 },
    hp: 35,
    mp: 0,
    ac: 10,
    skills: [{ skillId: 'basic_attack', slotId: 's1' }, { skillId: 'rock_throw', slotId: 's2' }],
    tags: ['类人生物'],
    description: '矮小的绿皮生物，拿着简陋的短刀，也会捡石头砸人。',
    job: '强盗',
    style: '游击',
    loot: [
      { itemId: 'potion_small', chance: 0.45, minCount: 1, maxCount: 1 },
      { itemId: 'ether_small', chance: 0.25, minCount: 1, maxCount: 1 },
    ],
  },
};

// ────────────────────────────────────────────
//  遭遇组
// ────────────────────────────────────────────

export const ENCOUNTER_GROUPS: Record<string, EncounterGroup> = {
  slime_solo: {
    id: 'slime_solo',
    description: '一只史莱姆挡在了路上。',
    monsters: [{ monsterId: 'slime', count: 1 }],
  },
  slime_pair: {
    id: 'slime_pair',
    description: '两只史莱姆从草丛中钻了出来。',
    monsters: [{ monsterId: 'slime', count: 2 }],
  },
  wild_boar: {
    id: 'wild_boar',
    description: '一头野猪怒气冲冲地向你冲来！',
    monsters: [{ monsterId: 'wild_boar', count: 1 }],
  },
  wolf_pair: {
    id: 'wolf_pair',
    description: '两只森林狼从暗处现身，包围了你。',
    monsters: [{ monsterId: 'forest_wolf', count: 2 }],
  },
  goblin_pair: {
    id: 'goblin_pair',
    description: '两个哥布林挥舞着短刀跳了出来。',
    monsters: [{ monsterId: 'goblin', count: 2 }],
  },
  goblin_wolf: {
    id: 'goblin_wolf',
    description: '一个哥布林带着一只森林狼，似乎是它的驯兽师。',
    monsters: [
      { monsterId: 'goblin', count: 1 },
      { monsterId: 'forest_wolf', count: 1 },
    ],
  },
};

// ────────────────────────────────────────────
//  规则配置（d20 默认值）
// ────────────────────────────────────────────

export const DEFAULT_RULES = {
  版本: 'dnd-lite-v1',
  检定模式: 'dnd' as const,
  骰子: {
    攻击骰: '1d20' as const,
    暴击阈值: 20,
    失误阈值: 1,
  },
  数值规则: {
    等级上限: 20,
    属性下限: 1,
    属性上限: 20,
    技能栏上限: 8,
    状态上限: 8,
    开局基础属性: 5,
    开局自由属性点: 0,
    每级属性点: 1,
    单级单项属性上限: 1,
    幸运可加点: false,
    生命层次等级跨度: 4,
    生命层次伤害修正: 0.1,
    生命层次控制修正: 1,
  },
  资源规则: {
    默认行动点: 1,
    回合MP恢复: 2,
    防御行动减伤: 0.4,
    逃跑基础DC: 13,
    战斗金币基础值: 12,
    战斗金币等级系数: 4,
    战斗掉落基础概率: 0.35,
  },
  敌方掉落表: {} as Record<string, { itemId: string; chance: number; minCount: number; maxCount: number }[]>,
};

// ────────────────────────────────────────────
//  初始物品（背包用）
// ────────────────────────────────────────────

export const DEFAULT_ITEMS = {
  potion_small: {
    id: 'potion_small',
    名称: '小型生命药水',
    类型: 'healing' as const,
    描述: '恢复 20 点生命值。',
    目标类型: 'self' as const,
    数量: 3,
    战斗可用: true,
    回复HP: 20,
  },
  ether_small: {
    id: 'ether_small',
    名称: '小型法力药水',
    类型: 'mana' as const,
    描述: '恢复 10 点法力值。',
    目标类型: 'self' as const,
    数量: 1,
    战斗可用: true,
    回复MP: 10,
  },
};
