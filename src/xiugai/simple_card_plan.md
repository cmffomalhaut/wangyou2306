# 简单卡 酒馆助手脚本 计划

## 目标

基于 wangyou 战斗引擎，创建一套通用的简单角色卡。AI 遇敌后暂停描写，战斗引擎接管，结束后回写 MVU。

## 文件结构（预计）

```
src/simple_card/
├── mvu_schema.ts          # 1. 数据结构脚本（已完成）
├── battle_data.ts         # 2. 硬编码数据库（已完成）
├── battle_adapter.ts      # 3. 简单↔完整转换（已完成）
├── battle_index.ts        # 4. 战斗引擎入口（已完成）
├── 界面/
│   ├── index.html         # 5. Vue 入口 HTML
│   ├── index.ts           # 6. Vue 挂载入口
│   ├── App.vue            # 7. 浮动面板主组件
│   ├── store.ts           # 8. 数据 store（适配完整 schema）
│   ├── global.css         # 9. 面板样式
│   ├── useAutoBattle.ts   #10. 自动战斗检测
│   ├── useBattleCommand.ts #11. 战斗指令
│   ├── anim.ts            #12. 动画
│   └── components/
│       ├── BattleArena.vue    #13.
│       ├── BattleResultModal.vue #14.
│       ├── BattleLogPanel.vue #15. （未使用，保留）
│       ├── BattleUnitCard.vue #16. （未使用，保留）
│       ├── ItemPanel.vue      #17. （未使用，保留）
│       ├── SkillPanel.vue     #18.
│       ├── TargetPanel.vue    #19. （未使用，保留）
│       └── TurnOrderBar.vue   #20.
└── 界面入口/
    └── panel_loader.ts     #21. UI 独立脚本：按钮→创建浮动面板→加载 Vue
```

## 构建文件

- `build-local.js` — 加 simple_card 脚本 entry（3 条）
- `vite.config.simple-ui.ts` — Vue UI 单独构建配置（viteSingleFile + IIFE）

---

## 步骤

### 第一步：更新构建配置
- [x] 修改 `build-local.js`，加 simple_card entry：
  - `mvu_schema.ts` → `变量结构/index.js`
  - `battle_index.ts` → `战斗系统/index.js`
  - `panel_loader.ts` → `界面入口/index.js`
- [x] 新建 `vite.config.simple-ui.ts`（root 指向 `src/simple_card/界面/`，IIFE 格式）

### 第二步：复制 UI 文件（从 wangyou 界面/状态栏）
- [x] 复制所有文件到 `simple_card/界面/`

### 第三步：适配 UI
- [x] `store.ts`：import 路径改为 `../../wangyou/schema`
- [x] `index.ts`：mount target 改为 `#battle-panel-root`
- [x] `index.html`：mount target 改为 `#battle-panel-root`
- [x] `App.vue`：浮动面板 wrapper + 关闭按钮
- [x] `App.vue`：`availableItems` 从 `角色档案.protagonist` 读取（不是 `hero`）
- [x] `App.vue`：`closePanel()` 改为 hide（不是 remove），支持重新打开
- [x] `global.css`：浮动面板覆盖层/容器/标题栏样式
- [x] `global.css`：修复 `:root {}` 包裹自定义属性（之前是孤立的）
- [x] 删除 `BattleHeader.vue`（浮动面板不需要）
- [x] `useAutoBattle.ts`：import 路径修复、移除自动关闭、结算后重置 hasHandled

### 第四步：创建 UI 入口脚本
- [x] 新建 `simple_card/界面入口/panel_loader.ts`
- [x] 注册酒馆助手按钮"打开战斗面板"
- [x] 点击：检查 overlay 是否已存在 → 显示，否则 fetch HTML → 注入样式 + 脚本 → 挂载
- [x] 内联脚本使用 `<script>` 而非 `<script type="module">`（IIFE 需要 window 全局变量）
- [x] 添加到构建配置

### 第五步：构建测试
- [x] 运行 `build-local.js`：6 个脚本构建成功
- [x] 运行 `vite build --config vite.config.simple-ui.ts`：Vue UI HTML 构建成功
- [x] 检查输出文件：`dist-local/simple_card/` 下所有文件齐全

---

## 按钮清单

| 脚本 | 按钮 |
|------|------|
| 变量结构 | 无（自动注册 schema） |
| 战斗系统 | 开始战斗、推进战斗、战斗结算、清理战斗状态、强制重建战斗 |
| 战斗面板(UI) | 打开战斗面板 |

---

## 已知注意事项

1. CDN URL 在 `panel_loader.ts` 中硬编码为 `https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource@main/dist-local/simple_card/界面/index.html`，部署时需确认路径
2. `battle_adapter.ts` 中 `可用道具栏` 从全局背包的战斗可用物品填充
3. UI 依赖 `window.Vue`、`window.Pinia`、`window._`（lodash）作为全局变量，由酒馆环境提供
4. 简单卡 protagonist key 为 `protagonist`，不是 wangyou 的 `hero`
