# DND通用战斗系统具体脚本设计

> 目标：在 `src` 内先固定“需要写哪些脚本、每个脚本负责什么、脚本之间如何协作、如何与 MVU
> / 酒馆助手 / 前端界面对接”，再进入 `schema.ts`、`initvar.yaml`、`engine.ts` 的正式实现。

## 1. 系统定位

- 这是一个面向酒馆助手 + MVU 的 DND 风格通用战斗脚本体系。
- AI 负责：声明行动意图、输出战斗描写、在规则允许范围内选择技能和目标。
- 脚本负责：校验输入、检定掷骰、伤害治疗、状态增减、冷却处理、战斗日志、战后回写。
- 前端界面负责：展示 `战斗状态`、收集玩家点击形成 `BattleCommand`、显示日志和结果。
- `stat_data` 是唯一状态源，战斗脚本和前端都只围绕它工作。

## 2. 实现边界

### 2.1 当前阶段只做第一版

第一版脚本只覆盖以下闭环：

1. 从 `角色档案 + 技能定义表 + 规则配置` 初始化战斗实例。
2. 生成 `BattleState` 与 `BattleUnitState`。
3. 接收统一格式的 `BattleCommand`。
4. 执行攻击 / 治疗 / 护盾 / 状态 / 修正器 / 防御 / 逃跑。
5. 记录 `RollResult` 与 `BattleLogEntry`。
6. 产出 `BattleResultSummary` 并回写长期角色档案。

### 2.2 第一版暂不覆盖

- 地图站位与距离格系统。
- 多前排复杂阵型。
- 复杂反应链、借机攻击、插队技能。
- 装备词条系统、召唤物系统、持续场地效果。
- AI 直接修改运行时数值。

## 3. 建议脚本清单

基于当前仓库结构与 MVU 角色卡组织方式，建议把脚本拆成以下几类。

### 3.1 `脚本/变量结构/index.ts`

职责：

- 注册 `schema.ts` 中的 Zod 结构到 MVU。
- 作为整个战斗系统的数据合法性入口。

要求：

- 只负责 `registerMvuSchema(Schema)`。
- 不负责战斗逻辑。
- 保持无副作用、稳定、最小化。

### 3.2 `脚本/战斗系统/index.ts`

职责：

- 作为战斗系统脚本主入口。
- 等待 `Mvu` 初始化与变量就绪。
- 注册按钮事件、全局事件、必要的战斗控制动作。
- 串联 `store`、`engine`、`mvu_bridge`、`settlement`。

建议负责的事件：

- `开始战斗`
- `继续下一阶段`
- `执行敌方回合`
- `战斗结算`
- `清理战斗状态`

### 3.3 `脚本/战斗系统/schema_adapter.ts`

职责：

- 提供 `schema.ts` 输出类型到引擎内部类型的轻量适配。
- 将 `CharacterRecord` 转成 `BattleUnitState` 初始化输入。
- 将 `SkillDefinition` / `PassiveDefinition` 映射成引擎可直接执行的结构。

为什么需要单独一层：

- `schema.ts` 是面向 MVU 存储与世界书编写的结构。
- 引擎执行更适合使用收敛后的内部结构。
- 这样可以降低 `engine.ts` 对外部字段命名的直接耦合。

### 3.4 `脚本/战斗系统/engine.ts`

职责：

- 纯结算核心，不直接依赖 UI、不直接操作 DOM。
- 输入：`BattleState` + `BattleCommand` + 规则配置。
- 输出：更新后的 `BattleState`、本次 `RollResult[]`、`BattleLogEntry[]`、若结束则附加 `BattleResultSummary`。

必须坚持的原则：

- 纯函数优先。
- 不读写酒馆消息 DOM。
- 不直接调用按钮或界面 API。
- 不直接写角色长期档案，只产出结果。

### 3.5 `脚本/战斗系统/store.ts`

职责：

- 把当前楼层的 `stat_data.战斗状态` 包装成可供前端与脚本共用的访问层。
- 提供“读取当前战斗态 / 写回战斗态 / 重置战斗态”的统一方法。
- 约束前端只能读写 `玩家输入态`，复杂结算必须走引擎。

建议暴露的方法：

- `getStatData()`
- `getBattleState()`
- `setBattleState(next)`
- `patchBattleState(updater)`
- `clearBattleState()`
- `writePlayerInput(command)`

### 3.6 `脚本/战斗系统/commands.ts`

职责：

- 统一处理来自前端或脚本按钮的 `BattleCommand`。
- 做合法性校验与兜底修复。
- 保证敌我双方最终都走同一个命令入口。

建议校验内容：

- 行动者是否存在且可行动。
- 技能是否已装备、未禁用、冷却为 0。
- 资源是否足够。
- 目标是否合法。
- 当前阶段是否允许该行动。

### 3.7 `脚本/战斗系统/roll.ts`

职责：

- 封装 DND 检定逻辑。
- 统一生成 `RollResult`。

建议提供的方法：

- `rollInitiative(unit)`
- `rollAttack(check)`
- `rollSavingThrow(check)`
- `rollEscape(check)`
- `rollDamage(expr)`

规则要求：

- 明确支持优势 / 劣势。
- 明确支持暴击 / 大失败。
- 检定结果必须可记录、可回放、可用于前端日志展示。

### 3.8 `脚本/战斗系统/effects.ts`

职责：

- 专门执行 `EffectBlock[]`。
- 将每个白名单效果拆成独立处理函数。

建议支持的处理器：

- `applyDamageEffect`
- `applyHealEffect`
- `applyRestoreMpEffect`
- `applyShieldEffect`
- `applyStatusEffect`
- `removeStatusEffect`
- `applyModifierEffect`
- `applyTauntEffect`
- `applyForcedMoveEffect`

约束：

- 仅允许白名单 `kind`。
- 未知 `kind` 不执行，写入 `system` 日志。

### 3.9 `脚本/战斗系统/derive.ts`

职责：

- 进入战斗时根据长期数据生成运行时派生属性。
- 统一管理“五维 -> 当前属性”的公式。

建议只在两个时机调用：

1. 开战初始化。
2. 状态 / 修正器变化后重算局部属性。

建议派生输出：

- `护甲等级`
- `物理防御`
- `精神防御`
- `命中加值`
- `闪避加值`
- `先攻`
- `治疗强度`

### 3.10 `脚本/战斗系统/log.ts`

职责：

- 统一生成战斗日志文案。
- 将内部结算事件转换为 `BattleLogEntry`。

好处：

- 避免 `engine.ts` 内堆满文本拼接。
- 便于以后同时输出“简略日志”和“AI 可读结算摘要”。

### 3.11 `脚本/战斗系统/ai_bridge.ts`

职责：

- 管理“AI 能看到什么、不能看到什么”。
- 为 AI 提供可用技能、推荐目标、结算摘要，而不是完整内部公式。
- 将 AI 输出解析为统一 `BattleCommand`。

AI 输入建议只暴露：

- 当前回合号。
- 当前行动单位。
- 可用技能名称、描述、目标类型、剩余冷却、资源消耗。
- 目标当前 HP 比例、显著状态。
- 上一轮关键日志。

AI 输出建议限制为：

- `actionType`
- `skillId`
- `targetIds`
- 可选 `flavorText`

禁止 AI 输出：

- 直接写 HP、MP、状态剩余回合、经验值。

### 3.12 `脚本/战斗系统/settlement.ts`

职责：

- 读取已经结束的 `BattleState`。
- 生成 `BattleResultSummary`。
- 将结果安全回写到 `角色档案`、`背包`、长期日志。

必须回写的内容：

- `生命值.当前值`
- `法力值.当前值`
- `经验值.当前值`
- `等级`
- 战利品

不应直接回写：

- `BattleUnitState.当前属性`
- 技能运行态临时冷却
- 临时状态与修正器

## 4. 推荐目录结构

建议最终结构向以下方向收敛：

```text
src/zhanji/新建为src文件夹中的文件夹/
  schema.ts
  DND通用战斗系统数据结构设计.md
  DND通用战斗系统具体脚本设计.md
  脚本/
    MVU/
      index.ts
    变量结构/
      index.ts
    战斗系统/
      index.ts
      store.ts
      schema_adapter.ts
      derive.ts
      commands.ts
      roll.ts
      effects.ts
      log.ts
      settlement.ts
      ai_bridge.ts
      engine.ts
      types.ts
```

## 5. `index.ts` 主入口设计

`脚本/战斗系统/index.ts` 建议承担“编排层”角色，而不是把逻辑全部塞进去。

### 5.1 启动流程

1. `await waitGlobalInitialized('Mvu')`
2. `waitUntil` 当前楼层或目标楼层存在 `stat_data`
3. 通过 `Schema.parse` 读取变量
4. 初始化 `store`
5. 监听按钮 / 事件
6. 若检测到 `战斗状态.状态 === preparing`，自动补完初始化

### 5.2 事件来源

建议统一接受三类来源：

- 酒馆助手脚本库按钮
- 前端状态栏组件调用共享接口
- AI / 自动流程驱动的系统事件

### 5.3 入口伪代码

```ts
await waitGlobalInitialized('Mvu');
await waitUntil(() => _.has(Mvu.getMvuData({ type: 'message', message_id: -1 }), 'stat_data'));

const statStore = createBattleStateStore();

eventOn(getButtonEvent('开始战斗'), async () => {
  const stat = statStore.getStatData();
  const battle = initializeBattleFromStatData(stat);
  await statStore.setBattleState(battle);
});

eventOn(getButtonEvent('继续战斗'), async () => {
  const battle = statStore.getBattleState();
  if (!battle) return;
  const command = pickNextCommandFromInputState(battle);
  const next = resolveBattleCommand(battle, command);
  await statStore.setBattleState(next);
});
```

## 6. `engine.ts` 结算分层

建议把引擎拆成固定步骤，避免现有宝可梦式 `engine.ts` 那种单文件累积逻辑继续膨胀。

### 6.1 核心流程

1. `prepareTurnStart`
2. `validateCommand`
3. `payActionCost`
4. `resolveCheck`
5. `applyEffects`
6. `runPassiveHooks`
7. `updateCooldownsAndDurations`
8. `appendBattleLogs`
9. `checkBattleEnd`
10. `buildPlayerInputState`

### 6.2 关键函数建议

```ts
resolveBattleCommand(state, command);
resolveSkillAction(state, actor, skill, targets);
resolveDefendAction(state, actor);
resolveEscapeAction(state, actor);
resolveItemAction(state, actor, item, targets);
runTurnStartHooks(state, actor);
runTurnEndHooks(state, actor);
buildBattleResultSummary(state);
```

### 6.3 纯函数优先原则

- 输入旧状态，返回新状态。
- 随机行为集中在 `roll.ts`。
- 文案生成集中在 `log.ts`。
- 数据派生集中在 `derive.ts`。

## 7. `types.ts` 类型升级方向

当前 `src/zhanji/新建为src文件夹中的文件夹/脚本/战斗系统/types.ts`
仍偏向旧的宝可梦 3v3 设计，后续应改成与计划文档对齐的 DND 语义。

### 7.1 需要保留的命名习惯

- `BattleCommand`
- `BattleLogEntry`
- `BattleResult`

### 7.2 需要替换或新增的核心类型

- `RuleConfig`
- `CharacterRecord`
- `CharacterSkillSlot`
- `CharacterPassiveSlot`
- `SkillDefinition`
- `PassiveDefinition`
- `BattleState`
- `BattleSideState`
- `BattleUnitState`
- `RuntimeSkillState`
- `RuntimeStatusState`
- `RuntimeModifierState`
- `RollResult`
- `BattleResultSummary`

### 7.3 旧类型需要逐步淘汰

- 旧 `Element` 克制体系
- 旧宝可梦式 `BattleUnit`
- 旧 `switch` 行为建模
- 捕捉球相关结构
- 训练师人格驱动逻辑

## 8. MVU 数据流设计

### 8.1 只认 `stat_data`

所有脚本统一从以下位置读写：

- `Mvu.getMvuData({ type: 'message', message_id })`
- `_.get(data, 'stat_data')`

### 8.2 建议读写策略

- `schema.ts` 保证静态结构合法。
- `store.ts` 负责细粒度读写。
- `settlement.ts` 负责战后一次性回写长期档案。
- 前端不直接手改复杂运行时字段。

### 8.3 建议消息级存储范围

- 当前楼层保存当前战斗 `BattleState`。
- 长期角色数据继续保存在 `stat_data.角色档案`。
- 若后续要做战斗历史，可新增 `stat_data.日志.战斗归档`。

## 9. 前端协作接口

前端状态栏或战斗面板不要直接拼业务逻辑，建议只消费这些接口：

- `getBattleState()`
- `getSelectableSkills(actorId)`
- `getSelectableTargets(skillId)`
- `submitBattleCommand(command)`
- `getRecentBattleLogs(limit)`

前端需要展示的数据：

- 当前行动单位
- 双方单位快照
- 技能栏可用性
- 状态图标
- 战斗日志
- 回合阶段
- 结算面板

## 10. AI 对接策略

### 10.1 AI 只做声明，不做计算

建议 AI 提示词只要求输出：

- 选择哪个技能
- 对谁使用
- 行动意图说明
- 战斗描写

### 10.2 脚本解析 AI 输出

推荐把 AI 输出解析成：

```ts
type AiBattleIntent = {
  actorId: string;
  actionType: 'skill' | 'defend' | 'escape';
  skillId?: string;
  targetIds?: string[];
  flavorText?: string;
};
```

### 10.3 解析失败兜底

- 默认退回普通攻击或防御。
- 写入 `system` 日志，避免战斗中断。
- 不允许解析失败直接破坏 `BattleState`。

## 11. 战斗阶段机设计

建议第一版使用如下阶段枚举：

```ts
type BattlePhase = 'turn_start' | 'select_action' | 'select_target' | 'resolve_action' | 'turn_end' | 'battle_end';
```

阶段职责：

- `turn_start`：处理被动、DoT、回合恢复、可行动校验。
- `select_action`：等待玩家或 AI 形成 `BattleCommand`。
- `select_target`：前端目标选择态。
- `resolve_action`：执行检定与效果。
- `turn_end`：更新冷却、剩余回合、死亡检查。
- `battle_end`：产出结算摘要，等待回写。

## 12. 技能 DSL 执行策略

### 12.1 执行顺序

建议按以下顺序处理单个技能：

1. 校验消耗与冷却
2. 扣除资源
3. 执行命中/豁免/自动命中判定
4. 应用主效果
5. 应用副效果
6. 触发被动钩子
7. 生成日志

### 12.2 `EffectBlock` 不做自由扩展

- 文本描述仅供展示。
- 逻辑只认结构化字段。
- 新效果种类必须先加类型，再加处理器，再加日志映射。

## 13. 被动与状态处理策略

### 13.1 被动触发白名单

第一版严格限定：

- `battle_start`
- `turn_start`
- `turn_end`
- `before_attack`
- `after_attack`
- `before_damaged`
- `after_damaged`
- `on_kill`
- `on_defeat`

### 13.2 状态与修正器分离

- `状态列表` 负责异常、控制、持续伤害。
- `修正器列表` 负责属性增减。
- UI 展示时也分别处理。

## 14. 战后回写策略

`settlement.ts` 建议按固定顺序处理：

1. 计算胜负与回合数
2. 计算经验与掉落
3. 写入 `BattleResultSummary`
4. 回写 `角色档案`
5. 清空或归档 `战斗状态`

回写原则：

- 回写最小必要长期数据。
- 战斗临时派生值全部丢弃。
- 保证再次 `Schema.parse` 后仍合法。

## 15. 与现有仓库的直接对齐结论

结合当前仓库现状，接下来应按以下顺序推进：

1. 先补 `src/zhanji/新建为src文件夹中的文件夹/schema.ts`，把计划中的 DND 结构落成 Zod Schema。
2. 新增 `src/zhanji/新建为src文件夹中的文件夹/DND通用战斗系统数据结构设计.md`，固定字段边界。
3. 用新 schema 补 `src/zhanji/新建为src文件夹中的文件夹/世界书/变量/initvar.yaml` 的最小示例。
4. 重写 `src/zhanji/新建为src文件夹中的文件夹/脚本/战斗系统/types.ts` 为 DND 语义。
5. 将 `src/zhanji/新建为src文件夹中的文件夹/脚本/战斗系统/engine.ts`
   从“宝可梦 3v3 引擎”重构为“基于 BattleState 的纯结算引擎”。
6. 再让状态栏前端消费新的 `BattleState`。

## 16. 当前阶段的默认实现决策

为避免后续实现中反复摇摆，先固定如下决策：

- 默认只做 `1v1 / 单前排` 战斗，但目标字段保留数组。
- `BattleState` 是唯一运行时战斗状态容器。
- 长期档案与运行时快照严格分离。
- 技能和被动统一使用全局定义表引用。
- DND 检定统一封装，不允许每个技能自带不同骰制。
- 未知技能效果不执行，只记日志，不让引擎崩溃。
- AI 只能提交行动意图，不能提交结算结果。

## 17. 下一步落地目标

完成这份文档后，下一步应直接进入代码实现，优先级如下：

1. `schema.ts`
2. `世界书/变量/initvar.yaml`
3. `脚本/战斗系统/types.ts`
4. `脚本/战斗系统/derive.ts`
5. `脚本/战斗系统/roll.ts`
6. `脚本/战斗系统/effects.ts`
7. `脚本/战斗系统/engine.ts`

这样可以先把“数据结构 + 纯结算核心”打稳，再接 UI 和 AI 桥接。
