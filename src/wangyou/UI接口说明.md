# UI 接口说明

> 本文描述战斗UI（`界面/状态栏/`）与引擎层的数据接口，供前端改版参考。
> 改UI样式/布局只需关注各组件的 props，不需要动引擎代码。

---

## 数据来源

```
SillyTavern message 变量 stat_data (JSON)
  └─ store.ts → useDataStore()
       └─ 状态栏/App.vue（根组件，分发给子组件）
```

`useDataStore()` 返回的根对象类型为 `StatData`（定义在 `脚本/战斗系统/types.ts`）。

---

## 根组件关键计算值（App.vue）

| 变量 | 类型 | 说明 |
|------|------|------|
| `battleState` | `BattleState \| null` | `stat_data.战斗状态`，null 表示战斗未开始 |
| `allyUnit` | `BattleUnitState \| null` | 我方第一个存活单位 |
| `enemyUnits` | `BattleUnitState[]` | 敌方全部存活单位列表 |
| `allyUnits` | `BattleUnitState[]` | 我方全部存活单位列表 |
| `equippedSkills` | `SkillDefinition[]` | 当前行动单位的技能定义列表 |
| `availableItems` | `InventoryItem[]` | 背包中 `战斗可用 && 数量 > 0` 的道具 |

---

## 子组件 Props 一览

### BattleHeader

```ts
props: {
  battleState: BattleState | null   // 用于显示状态/阶段/回合数
  activeSelectionLabel: string      // 当前选中技能/道具的名称
  selectedTargetName: string        // 当前选中目标的名称
}
```

显示内容：战斗状态文字、当前阶段、回合数、选中行动提示。

---

### BattleUnitCard

```ts
props: {
  unit: BattleUnitState   // 单位完整状态
  side: 'ally' | 'enemy'
}
```

`BattleUnitState` 关键字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `名字` | string | 单位名称 |
| `当前资源.HP / HPMax` | number | 当前/最大HP |
| `当前资源.MP / MPMax` | number | 当前/最大MP |
| `当前资源.Shield` | number | 当前护盾值 |
| `行动计数器` | number | CTB计数器，越小越快行动 |
| `是否存活` | boolean | — |
| `是否可行动` | boolean | stun/freeze时为false |
| `状态列表` | `{ statusId, 名称, 剩余回合, 层数 }[]` | 当前附加状态 |
| `当前属性` | 见下 | 派生后的战斗属性 |

`当前属性` 字段：`力量 敏捷 体质 智力 感知 魅力 幸运 护甲等级 物理防御 精神防御 命中加值 闪避加值 先攻 生命层次 异常抗性 控制强度 治疗强度`

---

### SkillPanel

```ts
props: {
  skills: SkillDefinition[]          // 可用技能定义列表
  runtimeSkills: RuntimeSkillState[] // 运行时状态（冷却/禁用）
  selectedSkillId: string
  canAct: boolean
}
emits: ['select-skill', (skillId: string) => void]
```

`SkillDefinition` 关键字段：`id 名称 描述 目标类型 消耗.MP 消耗.冷却回合 检定.类型`

`RuntimeSkillState` 关键字段：`skillId 当前冷却 已禁用`

---

### ItemPanel

```ts
props: {
  items: InventoryItem[]
  selectedItemId: string
  activeSkillId: string
  canAct: boolean
}
emits: ['select-item', (itemId: string) => void]
```

`InventoryItem` 关键字段：`id 名称 数量 战斗可用 目标类型`

---

### TargetPanel

```ts
props: {
  targetType: 'single_enemy' | 'single_ally' | 'self' | 'all_enemies' | 'all_allies' | 'random_enemy'
  targetCandidates: BattleUnitState[]   // 可选目标列表
  selectedTargetId: string
  selectionLabel: string
}
emits: ['select-target', (unitId: string) => void]
```

AoE/self 类型时 `targetCandidates` 为空，TargetPanel 不显示。

---

### BattleLogPanel

```ts
props: {
  logs: BattleLogEntry[]
}
```

`BattleLogEntry`：`{ id, turn, type, text }`，`type` 枚举：`system action damage heal shield resource status`

---

### BattleResultModal

```ts
props: {
  result: {
    summary: string
    winner: 'ally' | 'enemy' | 'escaped'
    rounds: number
    expGain: number
    goldGain: number
    rewardTexts: string[]
  } | null
}
emits: ['settle']   // 用户确认结算，触发 applyBattleSummaryToRecords
```

---

## useBattleCommand composable

```ts
const {
  selectedSkillId,      // Ref<string>
  selectedItemId,       // Ref<string>
  selectedTargetId,     // Ref<string>
  activeMode,           // ComputedRef<'skill' | 'item' | null>
  activeSelectionLabel, // ComputedRef<string>
  pickedSkillTargetType,// ComputedRef<SkillDefinition['目标类型']>
  submitCommand,        // (command: PendingCommand) => void
} = useBattleCommand({ battleState, allyUnit, equippedSkills, availableItems })
```

---

## 战斗测试页（界面/战斗测试/App.vue）

独立于状态栏UI，直接调用引擎，无 store、无子组件。用于本地开发验证。

### 当前支持的功能

| 功能 | 说明 |
|------|------|
| 重置样例数据 | 恢复 `initvar.yaml` 初始状态 |
| 开始/初始化 | 调用 `advanceBattle` 无指令，触发 `battle_start` |
| 推进1步 | 每次调用一次 `advanceBattle` |
| 自动推进 | 循环推进直到玩家需要输入或战斗结束（上限50步） |
| 应用结算 | 调用 `applyBattleSummaryToRecords`，写回长期档案 |
| 单位卡片 | 显示我方/敌方所有单位的HP/MP/Shield/CTB/状态/属性/技能详情 |
| 行动顺序条 | 所有存活单位按 `行动计数器` 升序排列，当前行动者金色高亮 |
| 玩家行动面板 | 技能选择、单体技能目标选择、道具使用、防御、逃跑 |
| 最近检定 | 显示上一次 `advanceBattle` 产生的所有 d20 检定结果（骰值/修正/命中） |
| 最近日志 | 最近16条战斗日志 |
| 背包 | 战斗可用道具列表 |
| 结算摘要 | 战斗结束后的结算文本 |

### 数据流

```
initvar.yaml → data (ref<StatData>)
  └─ advanceBattle(data, command?) → { state, rolls, logs }
       ├─ data.战斗状态 = state
       └─ recentRolls = rolls（有检定时更新）
```

### 与状态栏UI的关系

测试页和状态栏UI**完全独立**，共享同一套引擎（`脚本/战斗系统/`）。改引擎时两者都受影响；改测试页样式只动 `界面/战斗测试/App.vue`，不影响状态栏UI，反之亦然。

---

## 改UI时的注意事项

1. **只改样式/布局**：修改各组件的 `<template>` 和 `<style>`，props 接口不变，引擎完全不受影响。
2. **新增展示字段**：从已有 props 中取，不需要改 store 或引擎。
3. **新增交互**：通过已有 emits（`select-skill / select-item / select-target / settle`）回传，不要在子组件内直接调用引擎。
4. **CTB队列展示**：`battleState.参战方.ally.单位列表` + `battleState.参战方.enemy.单位列表` 合并后按 `行动计数器` 升序排列即可，当前行动者 = `battleState.当前行动单位Id`。
