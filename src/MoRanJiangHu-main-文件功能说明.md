# MoRanJiangHu-main 文件功能说明

目标目录：`src/MoRanJiangHu-main/MoRanJiangHu-main/`

## 一、逐文件功能说明（按目录）

### (root)

- `.gitignore`：定义 Git 忽略规则，控制本地构建产物、缓存与敏感文件不被纳入版本管理。
- `App.tsx`：应用顶层 React 组件，组织主界面结构并挂载核心功能模块与全局状态入口。
- `CODE_OF_CONDUCT.md`：社区行为准则文档，规范贡献者在项目协作中的沟通与行为边界。
- `CONTRIBUTING.md`：贡献流程说明文档，描述提交流程、代码规范与协作约定。
- `index.html`：Vite 页面模板，定义应用挂载根节点与基础 HTML 结构。
- `index.tsx`：前端入口文件，创建 React 根实例并挂载顶层 App。
- `LICENSE`：开源许可文件，声明项目代码的使用、分发与修改许可条件。
- `metadata.json`：扩展/项目元数据文件，定义名称、描述和权限等运行元信息。
- `package-lock.json`：npm 锁定文件，固定依赖版本并确保构建可复现。
- `package.json`：项目依赖与脚本配置文件，定义构建命令与依赖清单。
- `postcss.config.cjs`：PostCSS 配置文件，控制 CSS 构建管线中的处理插件。
- `README.md`：项目总览与使用文档，介绍玩法目标、运行方式与主要功能边界。
- `SECURITY.md`：安全策略文档，说明漏洞报告与安全响应流程。
- `tailwind.config.cjs`：Tailwind 配置文件，定义扫描路径、主题扩展与插件配置。
- `tsconfig.json`：TypeScript 配置文件，约束编译目标、路径与类型检查策略。
- `types.ts`：全局类型定义文件，集中声明跨模块共享类型与接口。
- `vite.config.ts`：Vite 构建配置文件，定义开发服务器与打包行为。

### components/features/Agreement

- `components/features/Agreement/AgreementModal.tsx`：协议弹窗组件，负责展示条款内容并处理用户确认状态。
- `components/features/Agreement/MobileAgreementModal.tsx`：协议弹窗移动端版本，针对小屏布局调整交互与展示逻辑。

### components/features/Auth

- `components/features/Auth/GitHubSyncButton.tsx`：GitHub 同步入口组件，封装 OAuth 触发与同步状态反馈。

### components/features/Battle

- `components/features/Battle/BattleModal.tsx`：战斗模块弹窗，展示战斗信息并承接战斗相关交互。
- `components/features/Battle/MobileBattleModal.tsx`：移动端战斗弹窗，适配触屏交互与紧凑布局。

### components/features/Character

- `components/features/Character/CharacterModal.tsx`：角色信息弹窗，渲染角色属性与状态细节。
- `components/features/Character/CharacterProfileCard.tsx`：角色名片组件，用于聚合显示关键角色画像与标签信息。
- `components/features/Character/identitySummary.ts`：身份摘要辅助模块，生成或整理角色身份相关文案结构。
- `components/features/Character/MobileCharacter.tsx`：移动端角色面板组件，压缩并重排角色信息展示层次。

### components/features/Chat

- `components/features/Chat/ChatList.tsx`：对话列表组件，负责回合消息序列渲染与滚动区域组织。
- `components/features/Chat/InputArea.tsx`：输入区组件，处理用户输入、发送动作和输入状态联动。
- `components/features/Chat/MessageRenderers.tsx`：消息渲染器集合，按消息类型切换不同展示模板。
- `components/features/Chat/TurnItem.tsx`：单回合消息条目组件，整合一轮交互中的多段输出展示。

### components/features/Equipment

- `components/features/Equipment/EquipmentModal.tsx`：装备弹窗组件，显示装备位与物品效果并承接更换操作。

### components/features/Inventory

- `components/features/Inventory/index.tsx`：背包模块导出入口，统一导出桌面与移动端背包组件。
- `components/features/Inventory/InventoryModal.tsx`：背包弹窗组件，提供物品列表、筛选与操作入口。
- `components/features/Inventory/MobileInventoryModal.tsx`：移动端背包弹窗，优化小屏下物品浏览与点击区域。

### components/features/Kungfu

- `components/features/Kungfu/KungfuModal.tsx`：功法弹窗组件，展示功法清单与修炼相关属性信息。
- `components/features/Kungfu/MobileKungfuModal.tsx`：移动端功法弹窗，适配紧凑布局和触控切换操作。

### components/features/Map

- `components/features/Map/MapModal.tsx`：地图弹窗组件，渲染地图区域与位置相关信息。
- `components/features/Map/MobileMapModal.tsx`：移动端地图弹窗，强化手势友好展示与简化信息层级。

### components/features/Memory

- `components/features/Memory/MemoryModal.tsx`：记忆管理弹窗，提供记忆条目查看、维护与摘要相关入口。
- `components/features/Memory/MemorySummaryFlowMobileModal.tsx`：移动端记忆摘要流程弹窗，承载摘要生成过程的步骤化展示。
- `components/features/Memory/MemorySummaryFlowModal.tsx`：记忆摘要流程弹窗，组织摘要生成、确认与结果呈现链路。
- `components/features/Memory/MobileMemory.tsx`：移动端记忆面板，聚合记忆列表与快速操作入口。
- `components/features/Memory/NpcMemorySummaryFlowMobileModal.tsx`：移动端 NPC 记忆摘要流程弹窗，面向 NPC 维度的摘要处理。
- `components/features/Memory/NpcMemorySummaryFlowModal.tsx`：NPC 记忆摘要流程弹窗，组织 NPC 记忆提炼与确认过程。

### components/features/Music

- `components/features/Music/MusicPlayerUI.tsx`：音乐播放器界面组件，负责播放控制、曲目状态与 UI 反馈。
- `components/features/Music/MusicProvider.tsx`：音乐上下文提供器，管理全局播放状态与播放器能力注入。

### components/features/Music/mobile

- `components/features/Music/mobile/MobileMusicPlayer.tsx`：移动端音乐播放器组件，针对触控设备收敛播放控件布局。

### components/features/NewGame

- `components/features/NewGame/NewGameWizard.tsx`：新游戏向导组件，按步骤收集开局设定并初始化游戏状态。

### components/features/NewGame/mobile

- `components/features/NewGame/mobile/MobileNewGameWizard.tsx`：移动端新游戏向导，压缩步骤信息并强化单手操作流程。

### components/features/NovelDecomposition

- `components/features/NovelDecomposition/NovelDecompositionWorkbenchModal.tsx`：小说分解工作台弹窗，展示分解任务状态与人工校准入口。

### components/features/SaveLoad

- `components/features/SaveLoad/SaveLoadModal.tsx`：存档读档弹窗，连接本地存储服务执行导入导出与切档。

### components/features/Sect

- `components/features/Sect/MobileSect.tsx`：移动端宗门面板，展示宗门信息并提供相关交互入口。
- `components/features/Sect/SectModal.tsx`：宗门弹窗组件，渲染宗门数据与势力关系信息。

### components/features/Settings

- `components/features/Settings/ApiSettings.tsx`：API 设置组件，配置模型接口与鉴权相关参数。
- `components/features/Settings/ContextViewer.tsx`：上下文查看器组件，展示当前回合拼接上下文与注入片段。
- `components/features/Settings/CurrentNovelDecompositionInjectionSettings.tsx`：小说分解注入设置组件，配置分解结果注入上下文的策略。
- `components/features/Settings/GameSettings.tsx`：游戏设置组件，管理通用玩法参数与运行期开关。
- `components/features/Settings/HeroinePlanModelSettings.tsx`：女主规划模型设置组件，指定对应任务的模型与参数。
- `components/features/Settings/HistoryViewer.tsx`：历史查看器组件，展示历史回合或日志内容并支持检索查看。
- `components/features/Settings/ImageGenerationSettings.tsx`：图片生成设置组件，配置绘图模型、尺寸与提示词策略。
- `components/features/Settings/IndependentApiGptModeSettings.tsx`：独立 API GPT 模式设置组件，分离特定流程的模型调用配置。
- `components/features/Settings/MemorySettings.tsx`：记忆设置组件，配置记忆抽取、保留和触发策略。
- `components/features/Settings/MemorySummaryModelSettings.tsx`：记忆摘要模型设置组件，约束摘要任务的模型与参数方案。
- `components/features/Settings/MusicSettings.tsx`：音乐设置组件，管理播放器行为与资源配置。
- `components/features/Settings/NovelDecompositionApiSettings.tsx`：小说分解 API 设置组件，管理分解流程专用接口参数。
- `components/features/Settings/NovelDecompositionSettings.tsx`：小说分解总设置组件，组织流程开关、调度与注入选项。
- `components/features/Settings/NpcManager.tsx`：NPC 管理组件，维护 NPC 名单、状态与可编辑信息。
- `components/features/Settings/PlanningModelSettings.tsx`：规划模型设置组件，配置剧情规划流程的模型参数。
- `components/features/Settings/PolishModelSettings.tsx`：润色模型设置组件，约束文本润色任务的模型与采样参数。
- `components/features/Settings/PromptManager.tsx`：提示词管理组件，编辑与切换提示模板及相关开关。
- `components/features/Settings/RealitySettings.tsx`：现实模式设置组件，配置现实化叙事相关规则约束。
- `components/features/Settings/RecallModelSettings.tsx`：回忆检索模型设置组件，管理回忆召回任务的模型参数。
- `components/features/Settings/SettingsModal.tsx`：总设置弹窗容器，聚合各设置分区并统一提交交互。
- `components/features/Settings/StorageManager.tsx`：存储管理组件，处理本地数据清理、迁移与容量相关操作。
- `components/features/Settings/StoryPlanModelSettings.tsx`：剧情规划模型设置组件，配置剧情计划生成任务参数。
- `components/features/Settings/TavernPresetSettings.tsx`：Tavern 预设设置组件，维护预设导入导出与切换行为。
- `components/features/Settings/ThemeSettings.tsx`：主题设置组件，控制视觉主题与配色方案。
- `components/features/Settings/VariableManager.tsx`：变量管理组件，维护变量定义、编辑和可视化检视。
- `components/features/Settings/VariableModelSettings.tsx`：变量模型设置组件，配置变量生成/校准模型参数。
- `components/features/Settings/VisualSettings.tsx`：视觉设置组件，管理 UI 视觉细节与显示偏好。
- `components/features/Settings/WorldEvolutionModelSettings.tsx`：世界演化模型设置组件，配置世界演化任务模型与采样策略。
- `components/features/Settings/WorldSettings.tsx`：世界设定组件，调整世界观参数与世界生成行为。

### components/features/Settings/mobile

- `components/features/Settings/mobile/MobileSettingsModal.tsx`：移动端设置总弹窗，按小屏场景重排设置项与导航。

### components/features/Social

- `components/features/Social/ImageManagerModal.tsx`：社交图片管理弹窗，管理社交图像资源与选择逻辑。
- `components/features/Social/MobileSocial.tsx`：移动端社交面板，展示社交关系与移动端交互入口。
- `components/features/Social/SocialModal.tsx`：社交弹窗组件，呈现社交关系、好感与互动状态。

### components/features/Social/mobile

- `components/features/Social/mobile/MobileCustomSelect.tsx`：移动端自定义选择器，提供触屏友好的选项选择交互。
- `components/features/Social/mobile/MobileFileUploader.tsx`：移动端文件上传组件，处理移动端文件选择与上传前处理。
- `components/features/Social/mobile/MobileImageManagerModal.tsx`：移动端图片管理弹窗，封装图像上传、选择与确认流程。

### components/features/Story

- `components/features/Story/HeroinePlanModal.tsx`：女主规划弹窗，显示和编辑女主线规划结果。
- `components/features/Story/MobileHeroinePlanModal.tsx`：移动端女主规划弹窗，优化女主规划内容的移动端阅读与编辑。
- `components/features/Story/MobileStory.tsx`：移动端剧情面板，展示剧情结构与移动端操作入口。
- `components/features/Story/StoryModal.tsx`：剧情弹窗组件，承载剧情文本、计划和相关操作。

### components/features/Task

- `components/features/Task/MobileTask.tsx`：移动端任务面板，渲染任务列表和完成状态。
- `components/features/Task/TaskModal.tsx`：任务弹窗组件，展示任务详情、进度与操作按钮。

### components/features/Team

- `components/features/Team/MobileTeamModal.tsx`：移动端队伍弹窗，展示队伍成员与队伍相关状态。
- `components/features/Team/TeamModal.tsx`：队伍弹窗组件，管理队伍结构展示与交互入口。

### components/features/World

- `components/features/World/MobileWorldModal.tsx`：移动端世界弹窗，展示世界信息与移动端导航结构。
- `components/features/World/WorldModal.tsx`：世界弹窗组件，展示世界数据、地域关系与相关状态。

### components/features/Worldbook

- `components/features/Worldbook/WorldbookManagerModal.tsx`：世界书管理弹窗，维护世界书条目与注入策略。

### components/layout

- `components/layout/LandingPage.tsx`：落地页布局组件，承担进入游戏前的入口呈现与导航。
- `components/layout/LeftPanel.tsx`：左侧主面板布局组件，组织核心功能按钮与信息区块。
- `components/layout/MobileQuickMenu.tsx`：移动端快捷菜单组件，聚合常用功能入口与快速操作。
- `components/layout/RightPanel.tsx`：右侧主面板布局组件，承接辅助信息与设置入口。
- `components/layout/TopBar.tsx`：顶栏组件，显示全局状态、标题与常用操作入口。

### components/ui

- `components/ui/BookLoader.tsx`：通用加载组件，提供书页风格的加载动效展示。
- `components/ui/GameButton.tsx`：通用游戏按钮组件，统一按钮样式与交互反馈。
- `components/ui/Icons.tsx`：图标组件集合，集中定义可复用 SVG 图标组件。
- `components/ui/InAppConfirmModal.tsx`：应用内确认弹窗组件，封装通用确认/取消流程。
- `components/ui/InlineSelect.tsx`：行内选择器组件，提供轻量下拉/切换交互。
- `components/ui/rarityStyles.ts`：稀有度样式映射模块，按物品/功法稀有度输出对应样式配置。
- `components/ui/ToggleSwitch.tsx`：开关组件，统一布尔项切换交互与视觉状态。

### components/ui/decorations

- `components/ui/decorations/OrnateBorder.tsx`：装饰边框组件，提供可复用的古风边框视觉元素。

### data

- `data/newGamePresets.ts`：新开局预设数据模块，提供新游戏创建时的默认模板集。
- `data/presets.ts`：通用预设数据模块，提供运行时可选预设参数集合。
- `data/world.ts`：世界静态数据模块，定义世界结构和默认世界数据片段。

### docs

- `docs/剧情规划-女主规划-小说分解-动态世界联动重构计划.md`：联动重构计划文档，描述剧情规划、女主规划、分解与世界演化协同改造方案。
- `docs/项目功能梳理与重构任务清单.md`：项目功能梳理清单文档，汇总重构任务与阶段拆分。
- `docs/小说分解-主剧情章节联动改造计划.md`：小说分解与主剧情联动改造文档，定义章节联动目标与执行路径。
- `docs/COT_Conflict_Analysis.md`：COT 冲突分析文档，梳理提示词冲突点与影响范围。
- `docs/COT_Fix_Plan.md`：COT 修复计划文档，制定修复步骤、优先级与回归检查策略。

### functions/api/auth

- `functions/api/auth/github.ts`：服务端鉴权函数，处理 GitHub OAuth 相关请求与凭据交换。

### functions/api/github

- `functions/api/github/release-download.ts`：服务端下载函数，处理 GitHub Release 资源下载代理流程。
- `functions/api/github/release-upload.ts`：服务端上传函数，处理 GitHub Release 资源上传流程与校验。

### hooks

- `hooks/useGame.ts`：核心游戏 Hook，整合回合发送、状态推进、世界演化与多工作流编排。
- `hooks/useGameState.ts`：游戏状态 Hook，集中定义状态容器与更新函数。
- `hooks/useGitHubOAuth.ts`：GitHub OAuth Hook，封装授权流程、回调处理与状态管理。
- `hooks/useImageAssetPrefetch.ts`：图像资源预取 Hook，提前加载图片资源以减少展示延迟。

### hooks/useGame

- `hooks/useGame/bodyPolish.ts`：正文润色工作流模块，封装文本润色请求与结果应用逻辑。
- `hooks/useGame/contextSnapshot.ts`：上下文快照模块，构建和导出当前上下文快照以便调试或展示。
- `hooks/useGame/historyTurnWorkflow.ts`：历史回合工作流模块，组织回合历史写入与同步更新。
- `hooks/useGame/historyUtils.ts`：历史工具模块，提供回合历史清洗、转换与辅助判定函数。
- `hooks/useGame/imagePresetWorkflow.ts`：图片预设工作流，生成并应用绘图预设到图像请求链路。
- `hooks/useGame/mainStoryRequest.ts`：主剧情请求模块，负责剧情主请求的组装、调用与回包处理。
- `hooks/useGame/manualNpcWorkflow.ts`：手动 NPC 工作流模块，处理手动指定 NPC 的生成与上下文注入。
- `hooks/useGame/memoryRecall.ts`：记忆召回模块，按当前上下文触发记忆检索并返回可注入片段。
- `hooks/useGame/memoryUtils.ts`：记忆工具模块，提供记忆过滤、排序与格式化辅助函数。
- `hooks/useGame/npcContext.ts`：NPC 上下文模块，构建 NPC 相关上下文并参与 prompt 组装。
- `hooks/useGame/npcImageStateWorkflow.ts`：NPC 图片状态工作流，维护 NPC 图像状态机与切换逻辑。
- `hooks/useGame/npcImageWorkflow.ts`：NPC 图片工作流，组织 NPC 图像生成任务与结果落盘。
- `hooks/useGame/npcMemorySummary.ts`：NPC 记忆摘要模块，执行 NPC 维度记忆摘要与结构化输出。
- `hooks/useGame/npcSecretImageWorkflow.ts`：NPC 私密图像工作流，处理隐私分层图片生成与可见性控制。
- `hooks/useGame/openingStoryWorkflow.ts`：开场剧情工作流，管理开场生成请求、流式接收与状态落地。
- `hooks/useGame/planningUpdateWorkflow.ts`：规划更新工作流，按回合推进刷新剧情规划与相关派生状态。
- `hooks/useGame/playerImageWorkflow.ts`：玩家图像工作流，处理玩家角色图像生成和更新策略。
- `hooks/useGame/promptRuntime.ts`：Prompt 运行时模块，拼接多源提示词并进行变量注入与校正。
- `hooks/useGame/recallWorkflow.ts`：召回工作流模块，协调记忆召回、排序与注入节奏。
- `hooks/useGame/responseCommandProcessor.ts`：响应命令处理器，解析模型响应中的结构化命令并执行对应动作。
- `hooks/useGame/runtimeVariableWorkflow.ts`：运行时变量工作流，更新、校准并合并多来源变量状态。
- `hooks/useGame/saveCoordinator.ts`：存档协调器，统一调度自动保存、手动保存与冲突处理。
- `hooks/useGame/sceneImageArchiveWorkflow.ts`：场景图归档工作流，保存回合场景图并维护档案索引。
- `hooks/useGame/sceneImageTriggerWorkflow.ts`：场景图触发工作流，按条件触发场景图生成任务。
- `hooks/useGame/sceneImageWorkflow.ts`：场景图总工作流，管理场景图生成、更新与结果分发。
- `hooks/useGame/sendWorkflow.ts`：发送工作流模块，处理用户输入发送到模型的完整链路。
- `hooks/useGame/sessionLifecycleWorkflow.ts`：会话生命周期工作流，负责会话初始化、终止与重置逻辑。
- `hooks/useGame/stateTransforms.ts`：状态转换模块，提供状态结构变换与规范化函数。
- `hooks/useGame/storyResponseGuards.ts`：响应防护模块，对剧情响应执行结构校验与兜底处理。
- `hooks/useGame/storyState.ts`：剧情状态模块，维护剧情主状态与派生字段更新。
- `hooks/useGame/systemPromptBuilder.ts`：系统提示构建器，按运行时条件组装最终 system prompt。
- `hooks/useGame/thinkingContext.ts`：思维上下文模块，管理推理上下文片段与注入时机。
- `hooks/useGame/timeUtils.ts`：时间工具模块，处理游戏时间推进与时间格式转换。
- `hooks/useGame/variableCalibration.ts`：变量校准模块，按规则对变量值进行修正与约束。
- `hooks/useGame/variableCalibrationCoordinator.ts`：变量校准协调器，编排多轮校准过程与合并策略。
- `hooks/useGame/variableCalibrationMerge.ts`：变量校准合并模块，合并校准结果并处理冲突字段。
- `hooks/useGame/variableModelWorkflow.ts`：变量模型工作流，处理变量模型请求与回包映射。
- `hooks/useGame/worldEvolutionControl.ts`：世界演化控制模块，控制演化触发节奏与启停条件。
- `hooks/useGame/worldEvolutionUtils.ts`：世界演化工具模块，提供演化输入输出的辅助处理函数。
- `hooks/useGame/worldEvolutionWorkflow.ts`：世界演化工作流，执行演化任务、解析结果并更新世界状态。
- `hooks/useGame/worldGenerationWorkflow.ts`：世界生成工作流，执行初始世界与境界生成并落地为状态。

### hooks/useGame/config

- `hooks/useGame/config/settingsPersistenceWorkflow.ts`：设置持久化工作流，处理设置保存、加载与版本兼容逻辑。

### hooks/useGame/image

- `hooks/useGame/image/manualImageActionsWorkflow.ts`：手动图片动作工作流，处理手动触发生成/切换图片的流程。

### hooks/useGame/saveLoad

- `hooks/useGame/saveLoad/saveLoadWorkflow.ts`：读写档工作流，负责存档读取、恢复与导出导入路径。

### models

- `models/battle.ts`：战斗领域模型定义，声明战斗状态与数据结构契约。
- `models/character.ts`：角色领域模型定义，规范角色属性与角色相关结构。
- `models/environment.ts`：环境领域模型定义，描述环境信息与其状态结构。
- `models/heroinePlan.ts`：女主规划模型定义，描述女主规划主数据结构与约束。
- `models/imageGeneration.ts`：图像生成模型定义，约束绘图任务输入输出结构。
- `models/item.ts`：物品模型定义，描述物品属性、稀有度与携带结构。
- `models/kungfu.ts`：功法模型定义，规范功法属性、境界与展示字段。
- `models/novelDecomposition.ts`：小说分解模型定义，描述分解任务、章节与产出结构。
- `models/sect.ts`：宗门模型定义，约束宗门数据、关系与状态字段。
- `models/social.ts`：社交模型定义，规范社交关系、好感与互动状态结构。
- `models/story.ts`：剧情模型定义，描述剧情正文、阶段与附加信息结构。
- `models/storyPlan.ts`：剧情规划模型定义，约束规划节点与推进字段结构。
- `models/system.ts`：系统模型定义，规范系统级状态与配置结构。
- `models/task.ts`：任务模型定义，描述任务条目、进度与奖励结构。
- `models/world.ts`：世界模型定义，描述世界区域、势力与演化状态结构。
- `models/worldbook.ts`：世界书模型定义，约束世界书条目与触发配置结构。

### models/fandomPlanning

- `models/fandomPlanning/heroinePlan.ts`：同人规划女主模型，定义同人模式下女主规划结构。
- `models/fandomPlanning/story.ts`：同人规划剧情模型，定义同人模式剧情规划结构。

### plans

- `plans/character-anchor-plan.md`：角色锚定改造计划文档，定义提示词与角色锚定重构方案。
- `plans/fandom-mode-prompt-plan.md`：同人模式提示词改造文档，规划提示总线与模板化策略。
- `plans/novel-decomposition-feature-plan.md`：小说分解功能实施计划，拆解功能目标与里程碑。
- `plans/novel-decomposition-feature-progress.md`：小说分解功能进度文档，跟踪实施状态与已完成项。
- `plans/png-prompt-refactor-plan.md`：PNG 提示词重构计划文档，定义解析与提示拼装重构步骤。
- `plans/png-style-import-plan.md`：PNG 风格导入计划文档，描述画师串导入与处理策略。

### prompts

- `prompts/index.ts`：提示词统一导出入口，聚合各子模块提示以供运行时调用。

### prompts/core

- `prompts/core/actionOptions.ts`：核心提示词模块，定义行动选项相关提示模板与规则片段。
- `prompts/core/ancientRealism.ts`：核心提示词模块，定义古风写实风格约束与叙事规则。
- `prompts/core/cot.ts`：COT 核心提示模块，定义通用推理链提示骨架。
- `prompts/core/cotCombat.ts`：战斗 COT 提示模块，约束战斗推理与输出结构。
- `prompts/core/cotHeroine.ts`：女主规划 COT 提示模块，定义女主线推理指令模板。
- `prompts/core/cotJudge.ts`：判定 COT 提示模块，定义判定任务的推理规则。
- `prompts/core/cotOpening.ts`：开场 COT 提示模块，约束开场剧情生成推理流程。
- `prompts/core/cotPolish.ts`：润色 COT 提示模块，定义文本润色推理与输出要求。
- `prompts/core/cotShared.ts`：共享 COT 片段模块，集中复用公共推理片段。
- `prompts/core/data.ts`：核心数据提示模块，定义数据格式与字段说明提示片段。
- `prompts/core/format.ts`：格式提示模块，约束模型输出结构和格式规则。
- `prompts/core/heroinePlan.ts`：女主规划提示模块，定义女主规划任务的主提示模板。
- `prompts/core/heroinePlanCot.ts`：女主规划 COT 细化模块，补充女主规划推理链细节。
- `prompts/core/memory.ts`：记忆提示模块，定义记忆提取、摘要与注入规则。
- `prompts/core/realm.ts`：境界提示模块，定义境界体系与境界生成约束。
- `prompts/core/rules.ts`：核心规则提示模块，定义统一行为与叙事约束规则。
- `prompts/core/story.ts`：剧情核心提示模块，定义剧情推进与叙事组织规则。
- `prompts/core/timeProgress.ts`：时间推进提示模块，定义时间流逝与事件推进规则。
- `prompts/core/world.ts`：世界提示模块，定义世界观与世界状态更新约束。

### prompts/difficulty

- `prompts/difficulty/check.ts`：难度校验提示模块，约束难度检查规则。
- `prompts/difficulty/game.ts`：难度游戏提示模块，定义难度对游戏行为影响的规则片段。
- `prompts/difficulty/physiology.ts`：难度生理提示模块，约束生理相关难度逻辑与描述。

### prompts/runtime

- `prompts/runtime/defaults.ts`：运行时默认提示模块，提供默认提示组合与基础参数。
- `prompts/runtime/fandom.ts`：同人模式运行时提示模块，定义同人模式主提示拼装规则。
- `prompts/runtime/fandomPlanningAnalysis.ts`：同人规划分析提示模块，支持同人规划分析任务指令。
- `prompts/runtime/fandomRealmGeneration.ts`：同人境界生成提示模块，约束同人模式境界生成输出。
- `prompts/runtime/fandomWorldEvolution.ts`：同人世界演化提示模块，定义同人模式世界演化规则。
- `prompts/runtime/imageAnchorExtractionCot.ts`：图像锚点提取 COT 提示模块，指导图像锚点解析流程。
- `prompts/runtime/imageTokenizerCharacterCot.ts`：角色图像分词 COT 提示模块，定义角色图像标签解析规则。
- `prompts/runtime/imageTokenizerSceneCot.ts`：场景图像分词 COT 提示模块，定义场景图像标签解析逻辑。
- `prompts/runtime/imageTokenizerSecretPartCot.ts`：隐私部位分词 COT 提示模块，约束敏感图像分解规则。
- `prompts/runtime/novelDecomposition.ts`：小说分解运行时提示模块，定义分解任务主提示模板。
- `prompts/runtime/novelDecompositionCot.ts`：小说分解 COT 提示模块，约束分解推理链步骤与输出。
- `prompts/runtime/nsfw.ts`：NSFW 运行时提示模块，定义 NSFW 内容的规则边界与处理策略。
- `prompts/runtime/opening.ts`：开场运行时提示模块，定义开场生成提示拼装逻辑。
- `prompts/runtime/openingConfig.ts`：开场配置提示模块，提供开场配置相关提示片段。
- `prompts/runtime/openingPlanningInit.ts`：开场规划初始化提示模块，定义开局规划初始化规则。
- `prompts/runtime/openingVariableGenerationInit.ts`：开场变量初始化提示模块，约束开局变量生成逻辑。
- `prompts/runtime/openingWorldEvolutionInit.ts`：开场世界演化初始化提示模块，定义初始演化生成策略。
- `prompts/runtime/planningAnalysis.ts`：规划分析提示模块，定义规划分析任务指令与输出要求。
- `prompts/runtime/planUpdateReference.ts`：规划更新参考提示模块，提供规划更新时的引用模板。
- `prompts/runtime/pngParseCot.ts`：PNG 解析 COT 提示模块，指导 PNG 元信息解析与结构提取。
- `prompts/runtime/promptOwnership.ts`：提示词归属提示模块，约束提示来源与拼装优先级。
- `prompts/runtime/protocolDirectives.ts`：协议指令提示模块，定义交互协议与指令级约束。
- `prompts/runtime/realWorldMode.ts`：现实模式提示模块，定义现实化玩法下的叙事与规则策略。
- `prompts/runtime/recall.ts`：召回提示模块，定义记忆召回任务的输入输出规范。
- `prompts/runtime/roleIdentity.ts`：角色身份提示模块，约束角色身份一致性与呈现规则。
- `prompts/runtime/storyPlanSchema.ts`：剧情规划结构提示模块，定义规划结构 schema 指导。
- `prompts/runtime/variableCalibration.ts`：变量校准提示模块，定义变量校准任务指令模板。
- `prompts/runtime/variableCalibrationReference.ts`：变量校准参考提示模块，提供校准参考规则片段。
- `prompts/runtime/variableCot.ts`：变量 COT 提示模块，约束变量推理链与输出结构。
- `prompts/runtime/variableGeneration.ts`：变量生成提示模块，定义变量生成任务与格式要求。
- `prompts/runtime/variableModel.ts`：变量模型提示模块，定义变量建模规则与示例结构。
- `prompts/runtime/worldDataSchema.ts`：世界数据 schema 提示模块，提供世界数据结构规范。
- `prompts/runtime/worldEvolution.ts`：世界演化提示模块，定义世界演化任务主提示模板。
- `prompts/runtime/worldEvolutionCot.ts`：世界演化 COT 提示模块，定义演化推理链步骤。
- `prompts/runtime/worldGeneration.ts`：世界生成提示模块，定义世界初始化生成指令模板。
- `prompts/runtime/worldGenerationCot.ts`：世界生成 COT 提示模块，约束世界生成推理与输出结构。
- `prompts/runtime/worldSetup.ts`：世界设定提示模块，定义世界设定初始化规则片段。

### prompts/runtime/storyStyles

- `prompts/runtime/storyStyles/cultivation.ts`：修仙风格提示模块，定义修仙叙事风格规则。
- `prompts/runtime/storyStyles/general.ts`：通用风格提示模块，定义默认叙事风格片段。
- `prompts/runtime/storyStyles/harem.ts`：后宫风格提示模块，定义后宫向叙事风格约束。
- `prompts/runtime/storyStyles/index.ts`：风格提示导出入口，聚合各叙事风格模块。
- `prompts/runtime/storyStyles/ntlHarem.ts`：NTL 后宫风格提示模块，定义特定风格叙事规则。
- `prompts/runtime/storyStyles/pureLove.ts`：纯爱风格提示模块，定义纯爱向叙事约束。
- `prompts/runtime/storyStyles/shura.ts`：修罗场风格提示模块，定义冲突向叙事风格规则。

### prompts/shared

- `prompts/shared/realmDefaults.ts`：共享境界默认值模块，提供可复用境界默认配置文本。

### prompts/stats

- `prompts/stats/body.ts`：体质统计提示模块，定义身体属性统计规则。
- `prompts/stats/character.ts`：角色统计提示模块，定义角色属性统计与结构。
- `prompts/stats/combat.ts`：战斗统计提示模块，定义战斗数值统计规则。
- `prompts/stats/cultivation.ts`：修炼统计提示模块，定义修炼相关统计规则。
- `prompts/stats/drop.ts`：掉落统计提示模块，定义掉落相关计算与约束。
- `prompts/stats/experience.ts`：经验统计提示模块，定义经验增长与结算规则。
- `prompts/stats/items.ts`：物品统计提示模块，定义物品相关统计输出格式。
- `prompts/stats/itemWeight.ts`：负重统计提示模块，定义物品重量与负重计算规则。
- `prompts/stats/kungfu.ts`：功法统计提示模块，定义功法数值统计规则。
- `prompts/stats/npc.ts`：NPC 统计提示模块，定义 NPC 指标统计结构。
- `prompts/stats/others.ts`：其他统计提示模块，补充非主类指标统计规则。
- `prompts/stats/recovery.ts`：恢复统计提示模块，定义恢复机制和相关数值规则。
- `prompts/stats/world.ts`：世界统计提示模块，定义世界状态统计输出约束。

### prompts/writing

- `prompts/writing/emotionGuard.ts`：写作情绪防护提示模块，限制情绪表达与越界输出风险。
- `prompts/writing/noControl.ts`：写作免控制提示模块，约束不代替玩家控制的写作规则。
- `prompts/writing/perspective.ts`：写作视角提示模块，定义叙事人称与视角一致性规则。
- `prompts/writing/requirements.ts`：写作要求提示模块，定义硬性写作规范与输出要求。
- `prompts/writing/style.ts`：写作风格提示模块，定义语言风格与文本节奏约束。

### scripts

- `scripts/novelai-proxy.ps1`：PowerShell 代理脚本，用于 NovelAI 相关请求转发或本地代理调试。
- `scripts/promptStressTest.js`：Prompt 压测脚本，批量发送测试以评估提示词稳定性与响应表现。

### services

- `services/aiService.ts`：统一 AI 服务门面，向上层提供文本/图像等能力统一调用口。
- `services/dbService.ts`：数据库存储服务，处理本地数据读写、查询和序列化逻辑。
- `services/epubImport.ts`：EPUB 导入服务，解析电子书内容并映射到项目数据结构。
- `services/githubSync.ts`：GitHub 同步服务，处理存档或资源的远程同步与状态管理。
- `services/novelDecompositionCalibration.ts`：小说分解校准服务，执行分解结果校正和一致性修复。
- `services/novelDecompositionInjection.ts`：小说分解注入服务，将分解结果转换并注入运行时上下文。
- `services/novelDecompositionPipeline.ts`：小说分解管线服务，编排分解流程各阶段执行顺序。
- `services/novelDecompositionRuntime.ts`：小说分解运行时服务，调度分解请求并驱动运行时状态更新。
- `services/novelDecompositionScheduler.ts`：小说分解调度服务，控制任务队列与执行节奏。
- `services/novelDecompositionStore.ts`：小说分解存储服务，持久化分解任务与结果数据。
- `services/novelDecompositionTime.ts`：小说分解时间服务，处理任务时间轴与统计时间计算。
- `services/novelStructureHeuristics.ts`：小说结构启发式服务，提供章节/结构识别规则与评分逻辑。
- `services/saveArchiveService.ts`：存档归档服务，处理存档打包、恢复和归档格式转换。

### services/ai

- `services/ai/artistTagDictionary.ts`：画师标签字典服务，维护画师标签映射与查询基础数据。
- `services/ai/artistTagExtractor.ts`：画师标签提取服务，从文本中识别并抽取画师标签。
- `services/ai/chatCompletionClient.ts`：聊天补全客户端服务，封装 chat completion 请求与错误处理。
- `services/ai/imageTasks.ts`：图像任务服务，定义图像生成请求任务与响应解析逻辑。
- `services/ai/storyResponseParser.ts`：剧情响应解析服务，将模型文本响应解析为结构化剧情数据。
- `services/ai/storyTasks.ts`：剧情任务服务，封装剧情相关 AI 任务调用与结果转换。

### services/ai/image

- `services/ai/image/index.ts`：图像 AI 服务入口，导出图像任务运行能力与统一调用接口。
- `services/ai/image/runtime.ts`：图像运行时服务，处理图像任务参数拼装、调度和结果处理。

### services/ai/text

- `services/ai/text/index.ts`：文本 AI 服务入口，聚合文本生成相关能力导出。

### styles

- `styles/global.css`：全局样式文件，定义应用通用排版、布局和基础样式。
- `styles/root-theme.css`：根主题样式文件，定义全局 CSS 变量与主题色板。
- `styles/tailwind.css`：Tailwind 样式入口文件，注入 Tailwind 层与扩展样式。
- `styles/themes.ts`：主题配置脚本，定义可选主题及其映射参数。

### styles/components

- `styles/components/loader.css`：Loader 组件样式文件，定义加载动画与视觉表现细节。

### utils

- `utils/apiConfig.ts`：API 配置工具模块，统一读取和构建接口配置参数。
- `utils/builtinPrompts.ts`：内置提示词工具模块，维护内置提示模板与取用函数。
- `utils/customNewGamePresets.ts`：自定义新游戏预设工具，处理预设生成、校验与迁移。
- `utils/gameSettings.ts`：游戏设置工具模块，处理设置默认值与读写兼容逻辑。
- `utils/imageAssets.ts`：图像资源工具模块，管理图片资源索引与路径处理。
- `utils/imageManagerSettings.ts`：图像管理设置工具模块，处理图像管理相关配置项。
- `utils/imageSizeOptions.ts`：图像尺寸选项工具模块，定义并转换可用尺寸选项。
- `utils/jsonRepair.ts`：JSON 修复工具模块，对不规范 JSON 文本进行修复和安全解析。
- `utils/musicMetadata.ts`：音乐元数据工具模块，解析曲目信息并组织展示字段。
- `utils/openingConfig.ts`：开场配置工具模块，整理开场配置并提供默认值合并逻辑。
- `utils/promptFeatureToggles.ts`：提示词功能开关工具模块，管理各提示特性开闭状态。
- `utils/settingsSchema.ts`：设置 Schema 工具模块，定义配置校验规则与结构约束。
- `utils/stateHelpers.ts`：状态辅助工具模块，提供状态更新、拷贝与合并辅助函数。
- `utils/tavernPreset.ts`：Tavern 预设工具模块，处理预设格式转换与读写兼容。
- `utils/tokenEstimate.ts`：Token 估算工具模块，估算文本 token 用量用于上下文预算控制。
- `utils/visualSettings.ts`：视觉设置工具模块，处理视觉配置项默认值与迁移。
- `utils/worldbook.ts`：世界书工具模块，处理世界书条目读写、过滤与序列化。

## 二、按功能分组（多文件模块）

### G01_Project_Entry_and_Build_Config

- 模块说明：根目录入口与构建配置（.gitignore/App.tsx/index*/metadata/package*/postcss/tailwind/tsconfig/vite）
- 组成文件（11）：
  - `.gitignore`
  - `App.tsx`
  - `index.html`
  - `index.tsx`
  - `metadata.json`
  - `package-lock.json`
  - `package.json`
  - `postcss.config.cjs`
  - `tailwind.config.cjs`
  - `tsconfig.json`
  - `vite.config.ts`

### G02_Governance_Docs_and_Plans

- 模块说明：README/CONTRIBUTING/CODE_OF_CONDUCT/SECURITY/LICENSE + docs/* + plans/*
- 组成文件（16）：
  - `CODE_OF_CONDUCT.md`
  - `CONTRIBUTING.md`
  - `LICENSE`
  - `README.md`
  - `SECURITY.md`
  - `docs/COT_Conflict_Analysis.md`
  - `docs/COT_Fix_Plan.md`
  - `docs/剧情规划-女主规划-小说分解-动态世界联动重构计划.md`
  - `docs/小说分解-主剧情章节联动改造计划.md`
  - `docs/项目功能梳理与重构任务清单.md`
  - `plans/character-anchor-plan.md`
  - `plans/fandom-mode-prompt-plan.md`
  - `plans/novel-decomposition-feature-plan.md`
  - `plans/novel-decomposition-feature-progress.md`
  - `plans/png-prompt-refactor-plan.md`
  - `plans/png-style-import-plan.md`

### G03_UI_Agreement_Auth_Chat

- 模块说明：components/features/{Agreement,Auth,Chat}
- 组成文件（7）：
  - `components/features/Agreement/AgreementModal.tsx`
  - `components/features/Agreement/MobileAgreementModal.tsx`
  - `components/features/Auth/GitHubSyncButton.tsx`
  - `components/features/Chat/ChatList.tsx`
  - `components/features/Chat/InputArea.tsx`
  - `components/features/Chat/MessageRenderers.tsx`
  - `components/features/Chat/TurnItem.tsx`

### G04_UI_Character_Battle_Progression

- 模块说明：components/features/{Character,Battle,Equipment,Inventory,Kungfu,Map,Sect,Team}
- 组成文件（18）：
  - `components/features/Battle/BattleModal.tsx`
  - `components/features/Battle/MobileBattleModal.tsx`
  - `components/features/Character/CharacterModal.tsx`
  - `components/features/Character/CharacterProfileCard.tsx`
  - `components/features/Character/MobileCharacter.tsx`
  - `components/features/Character/identitySummary.ts`
  - `components/features/Equipment/EquipmentModal.tsx`
  - `components/features/Inventory/InventoryModal.tsx`
  - `components/features/Inventory/MobileInventoryModal.tsx`
  - `components/features/Inventory/index.tsx`
  - `components/features/Kungfu/KungfuModal.tsx`
  - `components/features/Kungfu/MobileKungfuModal.tsx`
  - `components/features/Map/MapModal.tsx`
  - `components/features/Map/MobileMapModal.tsx`
  - `components/features/Sect/MobileSect.tsx`
  - `components/features/Sect/SectModal.tsx`
  - `components/features/Team/MobileTeamModal.tsx`
  - `components/features/Team/TeamModal.tsx`

### G05_UI_World_Social_Story_Memory_Task

- 模块说明：components/features/{Memory,Story,Task,World,Worldbook,Social,Music,NewGame,NovelDecomposition,SaveLoad}
- 组成文件（28）：
  - `components/features/Memory/MemoryModal.tsx`
  - `components/features/Memory/MemorySummaryFlowMobileModal.tsx`
  - `components/features/Memory/MemorySummaryFlowModal.tsx`
  - `components/features/Memory/MobileMemory.tsx`
  - `components/features/Memory/NpcMemorySummaryFlowMobileModal.tsx`
  - `components/features/Memory/NpcMemorySummaryFlowModal.tsx`
  - `components/features/Music/MusicPlayerUI.tsx`
  - `components/features/Music/MusicProvider.tsx`
  - `components/features/Music/mobile/MobileMusicPlayer.tsx`
  - `components/features/NewGame/NewGameWizard.tsx`
  - `components/features/NewGame/mobile/MobileNewGameWizard.tsx`
  - `components/features/NovelDecomposition/NovelDecompositionWorkbenchModal.tsx`
  - `components/features/SaveLoad/SaveLoadModal.tsx`
  - `components/features/Social/ImageManagerModal.tsx`
  - `components/features/Social/MobileSocial.tsx`
  - `components/features/Social/SocialModal.tsx`
  - `components/features/Social/mobile/MobileCustomSelect.tsx`
  - `components/features/Social/mobile/MobileFileUploader.tsx`
  - `components/features/Social/mobile/MobileImageManagerModal.tsx`
  - `components/features/Story/HeroinePlanModal.tsx`
  - `components/features/Story/MobileHeroinePlanModal.tsx`
  - `components/features/Story/MobileStory.tsx`
  - `components/features/Story/StoryModal.tsx`
  - `components/features/Task/MobileTask.tsx`
  - `components/features/Task/TaskModal.tsx`
  - `components/features/World/MobileWorldModal.tsx`
  - `components/features/World/WorldModal.tsx`
  - `components/features/Worldbook/WorldbookManagerModal.tsx`

### G06_UI_Settings

- 模块说明：components/features/Settings/**
- 组成文件（30）：
  - `components/features/Settings/ApiSettings.tsx`
  - `components/features/Settings/ContextViewer.tsx`
  - `components/features/Settings/CurrentNovelDecompositionInjectionSettings.tsx`
  - `components/features/Settings/GameSettings.tsx`
  - `components/features/Settings/HeroinePlanModelSettings.tsx`
  - `components/features/Settings/HistoryViewer.tsx`
  - `components/features/Settings/ImageGenerationSettings.tsx`
  - `components/features/Settings/IndependentApiGptModeSettings.tsx`
  - `components/features/Settings/MemorySettings.tsx`
  - `components/features/Settings/MemorySummaryModelSettings.tsx`
  - `components/features/Settings/MusicSettings.tsx`
  - `components/features/Settings/NovelDecompositionApiSettings.tsx`
  - `components/features/Settings/NovelDecompositionSettings.tsx`
  - `components/features/Settings/NpcManager.tsx`
  - `components/features/Settings/PlanningModelSettings.tsx`
  - `components/features/Settings/PolishModelSettings.tsx`
  - `components/features/Settings/PromptManager.tsx`
  - `components/features/Settings/RealitySettings.tsx`
  - `components/features/Settings/RecallModelSettings.tsx`
  - `components/features/Settings/SettingsModal.tsx`
  - `components/features/Settings/StorageManager.tsx`
  - `components/features/Settings/StoryPlanModelSettings.tsx`
  - `components/features/Settings/TavernPresetSettings.tsx`
  - `components/features/Settings/ThemeSettings.tsx`
  - `components/features/Settings/VariableManager.tsx`
  - `components/features/Settings/VariableModelSettings.tsx`
  - `components/features/Settings/VisualSettings.tsx`
  - `components/features/Settings/WorldEvolutionModelSettings.tsx`
  - `components/features/Settings/WorldSettings.tsx`
  - `components/features/Settings/mobile/MobileSettingsModal.tsx`

### G07_UI_Layout_and_Shared_UI

- 模块说明：components/layout/** + components/ui/**
- 组成文件（13）：
  - `components/layout/LandingPage.tsx`
  - `components/layout/LeftPanel.tsx`
  - `components/layout/MobileQuickMenu.tsx`
  - `components/layout/RightPanel.tsx`
  - `components/layout/TopBar.tsx`
  - `components/ui/BookLoader.tsx`
  - `components/ui/GameButton.tsx`
  - `components/ui/Icons.tsx`
  - `components/ui/InAppConfirmModal.tsx`
  - `components/ui/InlineSelect.tsx`
  - `components/ui/ToggleSwitch.tsx`
  - `components/ui/decorations/OrnateBorder.tsx`
  - `components/ui/rarityStyles.ts`

### G08_Hooks_Core_Orchestration_State

- 模块说明：hooks/useGame.ts + hooks/useGameState.ts + hooks/useGitHubOAuth.ts + hooks/useImageAssetPrefetch.ts + hooks/useGame 下的核心编排/状态类
- 组成文件（22）：
  - `hooks/useGame.ts`
  - `hooks/useGame/bodyPolish.ts`
  - `hooks/useGame/config/settingsPersistenceWorkflow.ts`
  - `hooks/useGame/contextSnapshot.ts`
  - `hooks/useGame/historyTurnWorkflow.ts`
  - `hooks/useGame/historyUtils.ts`
  - `hooks/useGame/mainStoryRequest.ts`
  - `hooks/useGame/openingStoryWorkflow.ts`
  - `hooks/useGame/promptRuntime.ts`
  - `hooks/useGame/responseCommandProcessor.ts`
  - `hooks/useGame/saveCoordinator.ts`
  - `hooks/useGame/sendWorkflow.ts`
  - `hooks/useGame/sessionLifecycleWorkflow.ts`
  - `hooks/useGame/stateTransforms.ts`
  - `hooks/useGame/storyResponseGuards.ts`
  - `hooks/useGame/storyState.ts`
  - `hooks/useGame/systemPromptBuilder.ts`
  - `hooks/useGame/thinkingContext.ts`
  - `hooks/useGame/timeUtils.ts`
  - `hooks/useGameState.ts`
  - `hooks/useGitHubOAuth.ts`
  - `hooks/useImageAssetPrefetch.ts`

### G09_Hooks_Image_Memory_NPC_Variable_World_Workflows

- 模块说明：hooks/useGame 下除 G08 已收录外的其余文件
- 组成文件（26）：
  - `hooks/useGame/image/manualImageActionsWorkflow.ts`
  - `hooks/useGame/imagePresetWorkflow.ts`
  - `hooks/useGame/manualNpcWorkflow.ts`
  - `hooks/useGame/memoryRecall.ts`
  - `hooks/useGame/memoryUtils.ts`
  - `hooks/useGame/npcContext.ts`
  - `hooks/useGame/npcImageStateWorkflow.ts`
  - `hooks/useGame/npcImageWorkflow.ts`
  - `hooks/useGame/npcMemorySummary.ts`
  - `hooks/useGame/npcSecretImageWorkflow.ts`
  - `hooks/useGame/planningUpdateWorkflow.ts`
  - `hooks/useGame/playerImageWorkflow.ts`
  - `hooks/useGame/recallWorkflow.ts`
  - `hooks/useGame/runtimeVariableWorkflow.ts`
  - `hooks/useGame/saveLoad/saveLoadWorkflow.ts`
  - `hooks/useGame/sceneImageArchiveWorkflow.ts`
  - `hooks/useGame/sceneImageTriggerWorkflow.ts`
  - `hooks/useGame/sceneImageWorkflow.ts`
  - `hooks/useGame/variableCalibration.ts`
  - `hooks/useGame/variableCalibrationCoordinator.ts`
  - `hooks/useGame/variableCalibrationMerge.ts`
  - `hooks/useGame/variableModelWorkflow.ts`
  - `hooks/useGame/worldEvolutionControl.ts`
  - `hooks/useGame/worldEvolutionUtils.ts`
  - `hooks/useGame/worldEvolutionWorkflow.ts`
  - `hooks/useGame/worldGenerationWorkflow.ts`

### G10_Domain_Models_Data_Types

- 模块说明：data/** + models/** + types.ts
- 组成文件（22）：
  - `data/newGamePresets.ts`
  - `data/presets.ts`
  - `data/world.ts`
  - `models/battle.ts`
  - `models/character.ts`
  - `models/environment.ts`
  - `models/fandomPlanning/heroinePlan.ts`
  - `models/fandomPlanning/story.ts`
  - `models/heroinePlan.ts`
  - `models/imageGeneration.ts`
  - `models/item.ts`
  - `models/kungfu.ts`
  - `models/novelDecomposition.ts`
  - `models/sect.ts`
  - `models/social.ts`
  - `models/story.ts`
  - `models/storyPlan.ts`
  - `models/system.ts`
  - `models/task.ts`
  - `models/world.ts`
  - `models/worldbook.ts`
  - `types.ts`

### G11_Prompts_Core_Difficulty_Runtime_Main

- 模块说明：prompts/core/** + prompts/difficulty/** + prompts/index.ts + prompts/runtime/**（但 storyStyles 子目录除外）
- 组成文件（60）：
  - `prompts/core/actionOptions.ts`
  - `prompts/core/ancientRealism.ts`
  - `prompts/core/cot.ts`
  - `prompts/core/cotCombat.ts`
  - `prompts/core/cotHeroine.ts`
  - `prompts/core/cotJudge.ts`
  - `prompts/core/cotOpening.ts`
  - `prompts/core/cotPolish.ts`
  - `prompts/core/cotShared.ts`
  - `prompts/core/data.ts`
  - `prompts/core/format.ts`
  - `prompts/core/heroinePlan.ts`
  - `prompts/core/heroinePlanCot.ts`
  - `prompts/core/memory.ts`
  - `prompts/core/realm.ts`
  - `prompts/core/rules.ts`
  - `prompts/core/story.ts`
  - `prompts/core/timeProgress.ts`
  - `prompts/core/world.ts`
  - `prompts/difficulty/check.ts`
  - `prompts/difficulty/game.ts`
  - `prompts/difficulty/physiology.ts`
  - `prompts/index.ts`
  - `prompts/runtime/defaults.ts`
  - `prompts/runtime/fandom.ts`
  - `prompts/runtime/fandomPlanningAnalysis.ts`
  - `prompts/runtime/fandomRealmGeneration.ts`
  - `prompts/runtime/fandomWorldEvolution.ts`
  - `prompts/runtime/imageAnchorExtractionCot.ts`
  - `prompts/runtime/imageTokenizerCharacterCot.ts`
  - `prompts/runtime/imageTokenizerSceneCot.ts`
  - `prompts/runtime/imageTokenizerSecretPartCot.ts`
  - `prompts/runtime/novelDecomposition.ts`
  - `prompts/runtime/novelDecompositionCot.ts`
  - `prompts/runtime/nsfw.ts`
  - `prompts/runtime/opening.ts`
  - `prompts/runtime/openingConfig.ts`
  - `prompts/runtime/openingPlanningInit.ts`
  - `prompts/runtime/openingVariableGenerationInit.ts`
  - `prompts/runtime/openingWorldEvolutionInit.ts`
  - `prompts/runtime/planUpdateReference.ts`
  - `prompts/runtime/planningAnalysis.ts`
  - `prompts/runtime/pngParseCot.ts`
  - `prompts/runtime/promptOwnership.ts`
  - `prompts/runtime/protocolDirectives.ts`
  - `prompts/runtime/realWorldMode.ts`
  - `prompts/runtime/recall.ts`
  - `prompts/runtime/roleIdentity.ts`
  - `prompts/runtime/storyPlanSchema.ts`
  - `prompts/runtime/variableCalibration.ts`
  - `prompts/runtime/variableCalibrationReference.ts`
  - `prompts/runtime/variableCot.ts`
  - `prompts/runtime/variableGeneration.ts`
  - `prompts/runtime/variableModel.ts`
  - `prompts/runtime/worldDataSchema.ts`
  - `prompts/runtime/worldEvolution.ts`
  - `prompts/runtime/worldEvolutionCot.ts`
  - `prompts/runtime/worldGeneration.ts`
  - `prompts/runtime/worldGenerationCot.ts`
  - `prompts/runtime/worldSetup.ts`

### G12_Prompts_StoryStyles_Stats_Writing_Shared

- 模块说明：prompts/runtime/storyStyles/** + prompts/stats/** + prompts/writing/** + prompts/shared/**
- 组成文件（26）：
  - `prompts/runtime/storyStyles/cultivation.ts`
  - `prompts/runtime/storyStyles/general.ts`
  - `prompts/runtime/storyStyles/harem.ts`
  - `prompts/runtime/storyStyles/index.ts`
  - `prompts/runtime/storyStyles/ntlHarem.ts`
  - `prompts/runtime/storyStyles/pureLove.ts`
  - `prompts/runtime/storyStyles/shura.ts`
  - `prompts/shared/realmDefaults.ts`
  - `prompts/stats/body.ts`
  - `prompts/stats/character.ts`
  - `prompts/stats/combat.ts`
  - `prompts/stats/cultivation.ts`
  - `prompts/stats/drop.ts`
  - `prompts/stats/experience.ts`
  - `prompts/stats/itemWeight.ts`
  - `prompts/stats/items.ts`
  - `prompts/stats/kungfu.ts`
  - `prompts/stats/npc.ts`
  - `prompts/stats/others.ts`
  - `prompts/stats/recovery.ts`
  - `prompts/stats/world.ts`
  - `prompts/writing/emotionGuard.ts`
  - `prompts/writing/noControl.ts`
  - `prompts/writing/perspective.ts`
  - `prompts/writing/requirements.ts`
  - `prompts/writing/style.ts`

### G13_Functions_and_Services

- 模块说明：functions/** + services/**
- 组成文件（25）：
  - `functions/api/auth/github.ts`
  - `functions/api/github/release-download.ts`
  - `functions/api/github/release-upload.ts`
  - `services/ai/artistTagDictionary.ts`
  - `services/ai/artistTagExtractor.ts`
  - `services/ai/chatCompletionClient.ts`
  - `services/ai/image/index.ts`
  - `services/ai/image/runtime.ts`
  - `services/ai/imageTasks.ts`
  - `services/ai/storyResponseParser.ts`
  - `services/ai/storyTasks.ts`
  - `services/ai/text/index.ts`
  - `services/aiService.ts`
  - `services/dbService.ts`
  - `services/epubImport.ts`
  - `services/githubSync.ts`
  - `services/novelDecompositionCalibration.ts`
  - `services/novelDecompositionInjection.ts`
  - `services/novelDecompositionPipeline.ts`
  - `services/novelDecompositionRuntime.ts`
  - `services/novelDecompositionScheduler.ts`
  - `services/novelDecompositionStore.ts`
  - `services/novelDecompositionTime.ts`
  - `services/novelStructureHeuristics.ts`
  - `services/saveArchiveService.ts`

### G14_Styles_Scripts_Utilities

- 模块说明：styles/** + scripts/** + utils/**
- 组成文件（24）：
  - `scripts/novelai-proxy.ps1`
  - `scripts/promptStressTest.js`
  - `styles/components/loader.css`
  - `styles/global.css`
  - `styles/root-theme.css`
  - `styles/tailwind.css`
  - `styles/themes.ts`
  - `utils/apiConfig.ts`
  - `utils/builtinPrompts.ts`
  - `utils/customNewGamePresets.ts`
  - `utils/gameSettings.ts`
  - `utils/imageAssets.ts`
  - `utils/imageManagerSettings.ts`
  - `utils/imageSizeOptions.ts`
  - `utils/jsonRepair.ts`
  - `utils/musicMetadata.ts`
  - `utils/openingConfig.ts`
  - `utils/promptFeatureToggles.ts`
  - `utils/settingsSchema.ts`
  - `utils/stateHelpers.ts`
  - `utils/tavernPreset.ts`
  - `utils/tokenEstimate.ts`
  - `utils/visualSettings.ts`
  - `utils/worldbook.ts`

## 三、覆盖性核对

- 总文件数：328
- 已说明文件数：328
- 逐文件说明遗漏数：0
- 未说明文件列表：无
- 未纳入功能分组但已说明文件列表：无
- 结论：已完成全量覆盖核对，未发现遗漏。
