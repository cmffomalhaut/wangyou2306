# wangyou DnD 战斗系统

## 项目概述

这是一套为 SillyTavern 角色卡设计的**类DnD回合制战斗系统**，基于 TypeScript + Vue 3。

## 目录结构

```
src/wangyou/
├── 脚本/战斗系统/     ← 核心引擎（TypeScript）
├── 界面/状态栏/       ← 战斗UI（Vue 3，7个组件）
├── 界面/战斗测试/     ← 独立测试页
├── 世界书/变量/       ← SillyTavern 变量规则（YAML）
└── *.md               ← 设计文档
```

## 核心引擎文件

| 文件 | 职责 |
|------|------|
| `types.ts` | 所有类型定义（从 schema 派生） |
| `derive.ts` | CharacterRecord → BattleUnitState 属性派生 |
| `roll.ts` | d20检定（攻击/豁免/逃跑），支持优势/劣势 |
| `effects.ts` | 技能效果执行（7种效果，10种状态） |
| `commands.ts` | 指令合法性校验 |
| `ai.ts` | 敌方AI评分决策（5种行为倾向） |
| `engine.ts` | 战斗主引擎，~545行，先攻队列+回合流程 |
| `settlement.ts` | 战斗结算（经验/金币/掉落/升级/归档） |
| `store.ts` | 状态存储 |
| `bridge.ts` | 桥接层 |

## 关键设计

**伤害公式：**
```
base = 攻击属性 × ratio + flat
damage = max(1, floor((base - defense×0.35) × defendingFactor × max(0.4, tierFactor)))
defendingFactor = 防御中 ? 0.6 : 1.0
tierFactor = 1 + 生命层次差 × 0.1
```

**属性派生：**
- 物理防御 = `10 + 体质 + floor(等级/2)`
- 精神防御 = `10 + 感知 + floor(等级/2)`
- 生命层次 = `1 + floor((等级-1) / 层次跨度)`

**回合流程：** `battle_start → [turn_start → select_action → resolve_action → turn_end] × N → 结算`

## 完成度：约75-80%

核心引擎完整，可打完1v1战斗并正确结算。

## 已知缺口（按优先级）

1. **多单位战斗**（高）— `engine.ts` 中 `slice(0,1)` 硬限双方各1人
2. **被动效果不完整**（中）— `runPassiveTrigger` 只处理 `restore_mp`，其他效果类型未实现
3. **速度/多动机制**（中）— 速度属性未影响先攻队列
4. **反应动作**（低）— `标记.已用反应` 字段存在但引擎未使用
