import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

// ═══════════════════════════════════════════
//  helpers
// ═══════════════════════════════════════════

function clamp(v: number, lo: number, hi: number): number {
  return _.clamp(v, lo, hi);
}
function nonneg(v: number): number {
  return Math.max(0, v);
}

// ═══════════════════════════════════════════
//  共用子 schema
// ═══════════════════════════════════════════

const 七维 = z
  .object({
    力量: z.coerce.number().transform(v => clamp(v, 1, 20)).prefault(5),
    敏捷: z.coerce.number().transform(v => clamp(v, 1, 20)).prefault(5),
    体质: z.coerce.number().transform(v => clamp(v, 1, 20)).prefault(5),
    智力: z.coerce.number().transform(v => clamp(v, 1, 20)).prefault(5),
    感知: z.coerce.number().transform(v => clamp(v, 1, 20)).prefault(5),
    魅力: z.coerce.number().transform(v => clamp(v, 1, 20)).prefault(5),
    幸运: z.coerce.number().transform(v => clamp(v, 1, 20)).prefault(5),
  })
  .prefault({});

const 资源条 = z
  .object({
    当前值: z.coerce.number().transform(nonneg).prefault(100),
    最大值: z.coerce.number().transform(nonneg).prefault(100),
  })
  .prefault({});

const 经验条 = z
  .object({
    当前值: z.coerce.number().transform(nonneg).prefault(0),
    升级所需值: z.coerce.number().prefault(100),
  })
  .prefault({});

const 技能条目 = z.object({
  技能ID: z.string(),
  名称: z.string(),
  简介: z.string().prefault(''),
});

const 被动条目 = z.object({
  被动ID: z.string(),
  名称: z.string(),
  简介: z.string().prefault(''),
});

// ═══════════════════════════════════════════
//  角色基础（主角 & 队友共用）
// ═══════════════════════════════════════════

const 角色基础 = z
  .object({
    名字: z.string().prefault('冒险者'),
    等级: z.coerce
      .number()
      .transform(v => clamp(v, 1, 20))
      .prefault(1),
    七维: 七维,
    生命值: 资源条,
    法力值: 资源条,
    经验值: 经验条,
    成长: z
      .object({
        未分配属性点: z.coerce.number().transform(nonneg).prefault(0),
      })
      .prefault({}),
    技能列表: z.array(技能条目).prefault([]),
    被动列表: z.array(被动条目).prefault([]),
  })
  .prefault({});

// ═══════════════════════════════════════════
//  背包
// ═══════════════════════════════════════════

const 背包物品 = z.object({
  id: z.string(),
  名称: z.string(),
  简介: z.string().prefault(''),
  数量: z.coerce.number().transform(nonneg).prefault(0),
  战斗可用: z.boolean().prefault(true),
});

// ═══════════════════════════════════════════
//  世界
// ═══════════════════════════════════════════

const 世界 = z
  .object({
    时间: z.string().prefault('未定义'),
    地点: z.string().prefault('未定义'),
    剧情上下文: z.string().prefault('待初始化'),
    剧情状态: z.enum(['日常', '战斗', '偷袭']).prefault('日常'),
    当前遭遇: z.string().nullable().prefault(null),
  })
  .prefault({});

// ═══════════════════════════════════════════
//  战斗归档
// ═══════════════════════════════════════════

const 战斗归档条目 = z.object({
  battleId: z.string(),
  winner: z.enum(['ally', 'enemy', 'draw', 'escape']),
  rounds: z.coerce.number(),
  summary: z.string(),
  rewards: z.array(z.string()).prefault([]),
  timestamp: z.string(),
});

// ═══════════════════════════════════════════
//  顶层 Schema
// ═══════════════════════════════════════════

const Schema = z
  .object({
    世界: 世界,

    主角: 角色基础,

    队友: z
      .record(z.string(), 角色基础.extend({ 好感度: z.coerce.number().transform(v => clamp(v, 0, 100)).prefault(0) }))
      .prefault({})
      .refine(v => Object.keys(v).length <= 5, { message: '队友最多5人' }),

    金币: z.coerce.number().transform(nonneg).prefault(0),

    背包: z
      .record(z.string(), 背包物品)
      .prefault({})
      .transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0)),

    战斗状态: z.unknown().nullable().prefault(null),

    战斗归档: z.array(战斗归档条目).prefault([]),

    遭遇怪物列表: z.array(z.string()).prefault([]),
  })
  .prefault({});

// ═══════════════════════════════════════════
//  注册
// ═══════════════════════════════════════════

$(() => {
  registerMvuSchema(Schema);
});
