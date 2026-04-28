# 被动效果扩展

## 修改任务登记

- 修改目标：`runPassiveTrigger` 支持所有效果类型，复用 `applySkillEffects` 执行逻辑
- 问题现象：被动技能除 `restore_mp` 外全部静默忽略，被动表配置无效
- 预期结果：`heal` / `shield` / `apply_status` / `add_modifier` / `damage` 类被动均可触发，日志可见
- 非目标：不新增触发时机类型，不改被动定义 Schema
- 涉及文件：`engine.ts`、`effects.ts`、`initvar.yaml`
- 影响范围：被动触发逻辑，不影响主动技能执行路径
- 风险点：`runPassiveTrigger` 直接修改 unit 状态，需确认不与主动技能效果重复叠加
- 复现方式：配置一个 `heal` 类被动，触发时机 `turn_start`，观察日志无治疗记录
- 验证方式：配置后触发，日志出现对应效果记录，HP/Shield/状态正确变化

## 行为变更记录

- 变更点：`runPassiveTrigger` 执行逻辑
- 旧行为：只处理 `restore_mp`，其他 effect.kind 静默跳过
- 新行为：调用 `applySkillEffects` 的底层效果函数，支持所有 effect 类型
- 影响范围：所有配置了非 `restore_mp` 效果的被动技能
