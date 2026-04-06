const 阵营枚举 = z.enum(['player', 'ally', 'enemy', 'neutral']);
const 伤害偏向枚举 = z.enum(['physical', 'magic', 'hybrid']);
const 技能类型枚举 = z.enum(['主动', '反应', '持续']);
const 技能标签枚举 = z.enum(['physical', 'magic', 'heal', 'buff', 'debuff', 'control', 'social', 'support']);
const 目标类型枚举 = z.enum(['self', 'single_enemy', 'single_ally', 'all_enemies', 'all_allies', 'random_enemy']);
const 射程枚举 = z.enum(['melee', 'ranged', 'global']);
const 检定类型枚举 = z.enum(['attack_roll', 'saving_throw', 'auto_hit']);
const 属性枚举 = z.enum(['力量', '敏捷', '体质', '智力', '感知', '魅力', '幸运']);
const 对抗防御枚举 = z.enum(['护甲等级', '物理防御', '精神防御']);
const 被动时机枚举 = z.enum([
  'battle_start',
  'turn_start',
  'turn_end',
  'before_attack',
  'after_attack',
  'before_damaged',
  'after_damaged',
  'on_kill',
  'on_defeat',
]);
const 战斗状态枚举 = z.enum(['idle', 'preparing', 'running', 'resolving', 'ended']);
const 战斗模式枚举 = z.enum(['pve', 'pvp', 'boss']);
const 战斗阶段枚举 = z.enum([
  'turn_start',
  'select_action',
  'select_target',
  'resolve_action',
  'turn_end',
  'battle_end',
]);
const 日志类型枚举 = z.enum([
  'system',
  'roll',
  'damage',
  'heal',
  'status_apply',
  'status_remove',
  'modifier_apply',
  'resource',
  'action',
  'defeat',
  'victory',
]);
const 状态分类枚举 = z.enum(['dot', 'control', 'mental', 'special']);
const 修正目标枚举 = z.enum([
  '力量',
  '敏捷',
  '体质',
  '智力',
  '感知',
  '魅力',
  '幸运',
  '护甲等级',
  '物理防御',
  '精神防御',
  '命中加值',
  '闪避加值',
  '先攻',
  '生命层次',
]);

function clampAttribute(value: number): number {
  return _.clamp(value, 1, 20);
}

function buildDefault七维(base = 5) {
  return {
    力量: base,
    敏捷: base,
    体质: base,
    智力: base,
    感知: base,
    魅力: base,
    幸运: base,
  };
}
const 修正类型枚举 = z.enum(['buff', 'debuff']);
const 修正叠加枚举 = z.enum(['replace', 'stack']);
const 行动类型枚举 = z.enum(['skill', 'item', 'defend', 'escape']);

const EffectBlockSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('damage'),
    scale: 属性枚举,
    ratio: z.coerce.number(),
    flat: z.coerce.number(),
    damageType: z.string(),
  }),
  z.object({
    kind: z.literal('heal'),
    scale: 属性枚举,
    ratio: z.coerce.number(),
    flat: z.coerce.number(),
  }),
  z.object({
    kind: z.literal('restore_mp'),
    flat: z.coerce.number(),
    ratio: z.coerce.number().optional(),
  }),
  z.object({
    kind: z.literal('shield'),
    scale: 属性枚举,
    ratio: z.coerce.number(),
    flat: z.coerce.number(),
    duration: z.coerce.number(),
  }),
  z.object({
    kind: z.literal('apply_status'),
    statusId: z.string(),
    chance: z.coerce.number().transform(value => _.clamp(value, 0, 1)),
    duration: z.coerce.number(),
    power: z.coerce.number().optional(),
  }),
  z.object({
    kind: z.literal('remove_status'),
    removeTags: z.array(z.string()).prefault([]),
    count: z.coerce.number(),
  }),
  z.object({
    kind: z.literal('add_modifier'),
    modifierId: z.string(),
    duration: z.coerce.number(),
    value: z.coerce.number(),
  }),
  z.object({
    kind: z.literal('dispel'),
    count: z.coerce.number(),
  }),
  z.object({
    kind: z.literal('taunt'),
    duration: z.coerce.number(),
    dc: z.coerce.number().optional(),
  }),
  z.object({
    kind: z.literal('forced_move'),
    moveType: z.enum(['push', 'pull', 'break_guard']),
    distance: z.coerce.number(),
  }),
]);

export const BattleLogPayloadSchema = z
  .object({
    roll: z
      .object({
        rollType: z.enum(['attack', 'save', 'damage', 'escape', 'initiative']).optional(),
        actorId: z.string().optional(),
        targetId: z.string().optional(),
        dice: z.string().optional(),
        rawRolls: z.array(z.coerce.number()).optional(),
        finalRoll: z.coerce.number().optional(),
        modifier: z.coerce.number().optional(),
        dc: z.coerce.number().optional(),
        targetAC: z.coerce.number().optional(),
        success: z.boolean().optional(),
        isCriticalSuccess: z.boolean().optional(),
        isCriticalFail: z.boolean().optional(),
      })
      .partial()
      .optional(),
    damageBreakdown: z
      .object({
        base: z.coerce.number().optional(),
        reduced: z.coerce.number().optional(),
        shieldAbsorbed: z.coerce.number().optional(),
        final: z.coerce.number().optional(),
        damageType: z.string().optional(),
      })
      .partial()
      .optional(),
    statusMeta: z
      .object({
        statusId: z.string().optional(),
        duration: z.coerce.number().optional(),
        stacks: z.coerce.number().optional(),
        chance: z.coerce.number().optional(),
        applied: z.boolean().optional(),
      })
      .partial()
      .optional(),
  })
  .catchall(z.unknown());

export const PendingCommandSchema = z.object({
  actorId: z.string(),
  actionType: 行动类型枚举,
  skillId: z.string().optional(),
  itemId: z.string().optional(),
  targetIds: z.array(z.string()).optional(),
  clientHint: z
    .object({
      source: z.enum(['player_ui', 'enemy_ai']).prefault('player_ui'),
    })
    .optional(),
});

export const RuntimeSkillSchema = z.object({
  skillId: z.string(),
  当前冷却: z.coerce.number().prefault(0),
  已禁用: z.boolean().prefault(false),
  禁用原因: z.string().optional(),
});

export const RuntimeStatusSchema = z.object({
  statusId: z.string(),
  名称: z.string(),
  分类: 状态分类枚举,
  来源单位Id: z.string().optional(),
  层数: z.coerce.number().prefault(1),
  剩余回合: z.coerce.number().prefault(1),
  强度: z.coerce.number().optional(),
  标签: z.array(z.string()).prefault([]),
});

export const RuntimeModifierSchema = z.object({
  modifierId: z.string(),
  名称: z.string(),
  目标属性: 修正目标枚举,
  类型: 修正类型枚举,
  叠加方式: 修正叠加枚举,
  数值: z.coerce.number(),
  剩余回合: z.coerce.number(),
  来源单位Id: z.string().optional(),
});

export const RuntimeUnitResourceSchema = z
  .object({
    HP: z.coerce.number().prefault(0),
    HPMax: z.coerce.number().prefault(1),
    MP: z.coerce.number().prefault(0),
    MPMax: z.coerce.number().prefault(1),
    Shield: z.coerce.number().prefault(0),
  })
  .prefault({});

export const RuntimeUnitAttributesSchema = z
  .object({
    力量: z.coerce.number().prefault(0),
    敏捷: z.coerce.number().prefault(0),
    体质: z.coerce.number().prefault(0),
    智力: z.coerce.number().prefault(0),
    感知: z.coerce.number().prefault(0),
    魅力: z.coerce.number().prefault(0),
    幸运: z.coerce.number().prefault(0),
    护甲等级: z.coerce.number().prefault(10),
    物理防御: z.coerce.number().prefault(10),
    精神防御: z.coerce.number().prefault(10),
    命中加值: z.coerce.number().prefault(0),
    闪避加值: z.coerce.number().prefault(0),
    先攻: z.coerce.number().prefault(0),
    生命层次: z.coerce.number().prefault(1),
    异常抗性: z.coerce.number().prefault(0),
    控制强度: z.coerce.number().prefault(0),
    治疗强度: z.coerce.number().prefault(0),
  })
  .prefault({});

export const RuntimeUnitFlagsSchema = z
  .object({
    防御中: z.boolean().optional(),
    已用反应: z.boolean().optional(),
    本回合已行动: z.boolean().optional(),
  })
  .prefault({});

export const RuntimeUnitSchema = z.object({
  unitId: z.string(),
  sourceCharacterId: z.string(),
  名字: z.string(),
  阵营: z.enum(['ally', 'enemy']),
  是否存活: z.boolean().prefault(true),
  是否可行动: z.boolean().prefault(true),
  当前资源: RuntimeUnitResourceSchema,
  当前属性: RuntimeUnitAttributesSchema,
  技能栏: z.array(RuntimeSkillSchema).prefault([]),
  状态列表: z.array(RuntimeStatusSchema).prefault([]),
  修正器列表: z.array(RuntimeModifierSchema).prefault([]),
  标记: RuntimeUnitFlagsSchema,
});

export const BattleSideRuntimeSchema = z.object({
  阵营名: z.string(),
  单位列表: z.array(RuntimeUnitSchema).prefault([]),
});

export const BattleLogEntrySchema = z.object({
  id: z.string(),
  turn: z.coerce.number(),
  phase: z.string(),
  type: 日志类型枚举,
  actorId: z.string().optional(),
  targetId: z.string().optional(),
  skillId: z.string().optional(),
  text: z.string(),
  payload: BattleLogPayloadSchema.optional(),
});

export const Schema = z
  .object({
    世界: z
      .object({
        时间: z.string().prefault('未定义'),
        地点: z.string().prefault('未定义'),
        剧情上下文: z.string().prefault('待初始化'),
      })
      .prefault({}),
    规则配置: z
      .object({
        版本: z.string().prefault('dnd-lite-v1'),
        检定模式: z.literal('dnd').prefault('dnd'),
        骰子: z
          .object({
            攻击骰: z.literal('1d20').prefault('1d20'),
            暴击阈值: z.coerce
              .number()
              .transform(value => _.clamp(value, 2, 20))
              .prefault(20),
            失误阈值: z.coerce
              .number()
              .transform(value => _.clamp(value, 1, 19))
              .prefault(1),
          })
          .prefault({}),
        数值规则: z
          .object({
            等级上限: z.coerce.number().prefault(20),
            属性下限: z.coerce.number().prefault(1),
            属性上限: z.coerce.number().prefault(20),
            技能栏上限: z.coerce.number().prefault(6),
            状态上限: z.coerce.number().prefault(8),
            开局基础属性: z.coerce.number().prefault(5),
            开局自由属性点: z.coerce.number().prefault(0),
            每级属性点: z.coerce.number().prefault(1),
            单级单项属性上限: z.coerce.number().prefault(1),
            幸运可加点: z.boolean().prefault(false),
            生命层次等级跨度: z.coerce.number().prefault(4),
            生命层次伤害修正: z.coerce.number().prefault(0.1),
            生命层次控制修正: z.coerce.number().prefault(1),
          })
          .prefault({}),
        资源规则: z
          .object({
            默认行动点: z.coerce.number().prefault(1),
            回合MP恢复: z.coerce.number().prefault(2),
            防御行动减伤: z.coerce
              .number()
              .transform(value => _.clamp(value, 0, 0.95))
              .prefault(0.4),
            逃跑基础DC: z.coerce.number().prefault(13),
            战斗金币基础值: z.coerce.number().prefault(12),
            战斗金币等级系数: z.coerce.number().prefault(4),
            战斗掉落基础概率: z.coerce
              .number()
              .transform(value => _.clamp(value, 0, 1))
              .prefault(0.35),
          })
          .prefault({}),
        敌方掉落表: z
          .record(
            z.string(),
            z.array(
              z.object({
                itemId: z.string(),
                chance: z.coerce.number().transform(value => _.clamp(value, 0, 1)),
                minCount: z.coerce.number().prefault(1),
                maxCount: z.coerce.number().prefault(1),
              }),
            ),
          )
          .prefault({}),
      })
      .prefault({}),
    技能定义表: z
      .record(
        z.string(),
        z.object({
          id: z.string(),
          名称: z.string(),
          类型: 技能类型枚举,
          标签: z.array(技能标签枚举).prefault([]),
          描述: z.string().prefault(''),
          目标类型: 目标类型枚举,
          射程: 射程枚举,
          消耗: z
            .object({
              MP: z.coerce.number().prefault(0),
              HP: z.coerce.number().prefault(0),
              冷却回合: z.coerce.number().prefault(0),
              行动点: z.coerce.number().prefault(1),
            })
            .prefault({}),
          检定: z.object({
            类型: 检定类型枚举,
            攻击属性: 属性枚举.optional(),
            对抗防御: 对抗防御枚举.optional(),
            豁免属性: 属性枚举.optional(),
            基础DC: z.coerce.number().optional(),
            命中加值: z.coerce.number().optional(),
            优势: z.boolean().optional(),
            劣势: z.boolean().optional(),
          }),
          效果列表: z.array(EffectBlockSchema).prefault([]),
          AI约束: z
            .object({
              使用倾向: z.enum(['attack', 'burst', 'control', 'survive', 'support']).prefault('attack'),
              推荐时机: z.string().prefault('常规回合'),
            })
            .prefault({}),
        }),
      )
      .prefault({}),
    被动定义表: z
      .record(
        z.string(),
        z.object({
          id: z.string(),
          名称: z.string(),
          描述: z.string().prefault(''),
          触发时机: 被动时机枚举,
          条件: z
            .array(
              z.object({
                field: z.string(),
                operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'includes']).prefault('eq'),
                value: z.union([z.string(), z.coerce.number(), z.boolean()]),
              }),
            )
            .prefault([]),
          效果列表: z.array(EffectBlockSchema).prefault([]),
        }),
      )
      .prefault({}),
    角色档案: z
      .record(
        z.string(),
        z.object({
          id: z.string(),
          名字: z.string(),
          阵营: 阵营枚举,
          简介: z.string().prefault(''),
          标签: z.array(z.string()).prefault([]),
          等级: z.coerce
            .number()
            .transform(value => Math.max(1, value))
            .prefault(1),
          经验值: z
            .object({
              当前值: z.coerce.number().prefault(0),
              升级所需值: z.coerce.number().prefault(100),
            })
            .prefault({}),
          成长: z
            .object({
              未分配属性点: z.coerce.number().prefault(0),
            })
            .prefault({}),
          七维: z
            .object({
              力量: z.coerce.number().transform(clampAttribute).prefault(5),
              敏捷: z.coerce.number().transform(clampAttribute).prefault(5),
              体质: z.coerce.number().transform(clampAttribute).prefault(5),
              智力: z.coerce.number().transform(clampAttribute).prefault(5),
              感知: z.coerce.number().transform(clampAttribute).prefault(5),
              魅力: z.coerce.number().transform(clampAttribute).prefault(5),
              幸运: z.coerce.number().transform(clampAttribute).prefault(5),
            })
            .prefault({}),
          资源: z
            .object({
              生命值: z
                .object({ 当前值: z.coerce.number().prefault(100), 最大值: z.coerce.number().prefault(100) })
                .prefault({}),
              法力值: z
                .object({ 当前值: z.coerce.number().prefault(30), 最大值: z.coerce.number().prefault(30) })
                .prefault({}),
            })
            .prefault({}),
          派生基线: z
            .object({
              护甲等级: z.coerce.number().prefault(10),
              控制强度: z.coerce.number().prefault(0),
              异常抗性: z.coerce.number().prefault(0),
            })
            .prefault({}),
          战斗定位: z
            .object({
              职业: z.string().prefault('冒险者'),
              流派: z.string().prefault('均衡'),
              伤害偏向: 伤害偏向枚举.prefault('hybrid'),
            })
            .prefault({}),
          抗性: z
            .object({
              伤害抗性: z.record(z.string(), z.coerce.number()).prefault({}),
              状态抗性: z.record(z.string(), z.coerce.number()).prefault({}),
            })
            .prefault({}),
          装备栏: z
            .object({
              武器: z.string().optional(),
              防具: z.string().optional(),
              饰品: z.array(z.string()).prefault([]),
            })
            .prefault({}),
          技能表: z
            .array(
              z.object({
                slotId: z.string(),
                skillId: z.string(),
                已装备: z.boolean().prefault(true),
                已解锁: z.boolean().prefault(true),
                来源: z.string().prefault('初始'),
              }),
            )
            .prefault([]),
          被动表: z
            .array(
              z.object({
                slotId: z.string(),
                passiveId: z.string(),
                已解锁: z.boolean().prefault(true),
                来源: z.string().prefault('初始'),
              }),
            )
            .prefault([]),
          可用道具栏: z.array(z.string()).prefault([]),
        }),
      )
      .prefault({}),
    背包: z
      .record(
        z.string(),
        z.object({
          id: z.string(),
          名称: z.string(),
          类型: z.enum(['healing', 'mana', 'revive', 'buff']).prefault('healing'),
          描述: z.string().prefault(''),
          目标类型: 目标类型枚举.prefault('self'),
          数量: z.coerce
            .number()
            .transform(value => Math.max(0, value))
            .prefault(0),
          回复HP: z.coerce.number().optional(),
          回复MP: z.coerce.number().optional(),
          战斗可用: z.boolean().prefault(true),
        }),
      )
      .prefault({}),
    金币: z.coerce.number().prefault(0),
    战斗归档: z
      .array(
        z.object({
          battleId: z.string(),
          winner: z.enum(['ally', 'enemy', 'draw', 'escape']),
          rounds: z.coerce.number(),
          summary: z.string(),
          rewards: z.array(z.string()).prefault([]),
          timestamp: z.string(),
        }),
      )
      .prefault([]),
    战斗状态: z
      .object({
        battleId: z.string(),
        状态: 战斗状态枚举,
        模式: 战斗模式枚举,
        回合数: z.coerce.number(),
        当前行动单位Id: z.string().optional(),
        当前阶段: 战斗阶段枚举,
        行动游标: z.coerce.number().prefault(0),
        参战方: z
          .object({
            ally: BattleSideRuntimeSchema.prefault({ 阵营名: '我方', 单位列表: [] }),
            enemy: BattleSideRuntimeSchema.prefault({ 阵营名: '敌方', 单位列表: [] }),
          })
          .prefault({}),
        先攻队列: z.array(z.string()).prefault([]),
        日志: z.array(BattleLogEntrySchema).prefault([]),
        随机种子: z.string().optional(),
        玩家输入态: z
          .object({
            可操作: z.boolean().prefault(false),
            待选技能Id: z.string().optional(),
            待选目标Id: z.string().optional(),
            可用行动: z.array(行动类型枚举).prefault(['skill', 'item', 'defend', 'escape']),
          })
          .prefault({}),
        待处理指令: PendingCommandSchema.optional(),
        结算结果: z
          .object({
            winner: z.enum(['ally', 'enemy', 'draw', 'escape']),
            rounds: z.coerce.number(),
            expGain: z.coerce.number().prefault(0),
            goldGain: z.coerce.number().prefault(0),
            summary: z.string().prefault(''),
            rewardTexts: z.array(z.string()).prefault([]),
            itemDrops: z.array(z.object({ itemId: z.string(), count: z.coerce.number() })).prefault([]),
            characterChanges: z
              .array(
                z.object({
                  characterId: z.string(),
                  hpAfter: z.coerce.number(),
                  mpAfter: z.coerce.number(),
                  gainedExp: z.coerce.number().optional(),
                  newLevel: z.coerce.number().optional(),
                  gainedAttributePoints: z.coerce.number().optional(),
                  defeated: z.boolean().optional(),
                }),
              )
              .prefault([]),
          })
          .optional(),
      })
      .or(z.null())
      .prefault(null),
  })
  .transform(data => {
    const normalizedCharacters = Object.fromEntries(
      Object.entries(data.角色档案).map(([key, record]) => {
        const legacyStats = (record as typeof record & { 六维?: typeof record.七维 }).六维;
        return [
          key,
          {
            ...record,
            七维: record.七维 ?? (legacyStats ? { ...buildDefault七维(), ...legacyStats, 幸运: 5 } : buildDefault七维()),
          },
        ];
      }),
    ) as typeof data.角色档案;

    const 战斗状态 = data.战斗状态;
    if (!战斗状态) {
      return {
        ...data,
        角色档案: normalizedCharacters,
      };
    }

    return {
      ...data,
      角色档案: normalizedCharacters,
      战斗状态: {
        ...战斗状态,
        参战方: {
          ally: {
            ...战斗状态.参战方.ally,
            单位列表: 战斗状态.参战方.ally.单位列表.map(item => RuntimeUnitSchema.parse(item)),
          },
          enemy: {
            ...战斗状态.参战方.enemy,
            单位列表: 战斗状态.参战方.enemy.单位列表.map(item => RuntimeUnitSchema.parse(item)),
          },
        },
      },
    };
  });

export type Schema = z.output<typeof Schema>;
