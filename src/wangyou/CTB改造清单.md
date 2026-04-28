# CTB 速度条机制改造清单

## 目标
将先攻队列改为 CTB（Count Time Battle）机制：
- 每个单位有行动计数器，计数器最小的单位先行动
- 行动后计数器重置，敏捷越高重置值越小（出手越频繁）
- 支持加速/减速技能直接修改计数器

## 公式
- 初始计数器 = `1000 - (1d20 + 先攻值)`（先攻高的人更快到0）
- 行动后重置 = `max(10, 100 - 敏捷 * 3)`（敏捷20时重置值40，敏捷5时重置值85）
- 先攻值 = `敏捷 + floor(幸运/3)`（已改，保持不变）

## 需要改动的文件

### 1. schema.ts
- `RuntimeUnitSchema` 加字段：`行动计数器: z.coerce.number().prefault(1000)`
- `EffectBlockSchema` 加新效果类型：`modify_counter`（flat: number，负数=加速，正数=减速）

### 2. derive.ts
- `deriveUnit` 初始化 `行动计数器: 1000`（战斗开始时由引擎用检定覆盖）

### 3. engine.ts
- `buildInitiativeQueue` → 废弃，改为 `getNextActor`：取 `行动计数器` 最小的存活单位
- `initializeBattleState`：初始化时为每个单位掷先攻检定，设置初始计数器
- `finishRound` / 回合推进逻辑：行动后重置该单位计数器，不再用队列游标
- `回合数` 语义变更：每个单位行动一次算一个"行动"，不再是"所有人都行动一轮"

### 4. effects.ts
- 新增 `modify_counter` 效果处理：直接修改目标单位的 `行动计数器`

### 5. 测试页 App.vue（界面/战斗测试）
- 日志/状态栏显示各单位当前计数器值，方便调试

## 不需要改动
- `roll.ts`（先攻检定复用 `_.random(1,20)`）
- `commands.ts`
- `settlement.ts`
- `ai.ts`
- `状态栏/` UI（已支持多单位）

## 风险点
- `行动游标` 字段在 schema 中存在，CTB 后不再使用，保留但忽略
- `回合数` 语义变化：原来是"第N轮（所有人行动一次）"，CTB 后改为"第N次行动"
- 需确认 `先攻队列` 字段在 schema 中保留（存空数组即可，不再使用）
