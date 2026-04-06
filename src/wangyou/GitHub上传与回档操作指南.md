# wangyou 项目 GitHub 上传与回档操作指南

本文用于规范 `src/wangyou`
的日常开发、提交、回档流程。后续让 AI 修改代码时，可直接要求 AI 严格按本文流程执行，降低改坏后无法恢复的风险。

## 1. 首次接入 GitHub（只做一次）

在项目根目录执行：

```bash
git init
git branch -M main
```

创建 `.gitignore`（如不存在），至少包含：

```gitignore
node_modules/
dist/
*.log
.DS_Store
```

首次提交：

```bash
git add .
git commit -m "chore: initial snapshot for wangyou"
```

在 GitHub 新建空仓库后，绑定并推送：

```bash
git remote add origin https://github.com/<your-name>/<repo-name>.git
git push -u origin main
```

## 2. 日常改动标准流程（每次都按这个来）

### 2.1 改动前：从 main 拉功能分支

```bash
git checkout main
git pull
git checkout -b feat/wangyou-<short-topic>
```

示例：`feat/wangyou-battle-ui`、`fix/wangyou-item-target`

### 2.2 改动中：小步提交

```bash
git add <changed-files>
git commit -m "fix: 修复道具目标校验默认值"
```

建议 1 个逻辑点对应 1 次提交，避免把很多不相关修改塞进一个 commit。

### 2.3 改动后：推送分支

```bash
git push -u origin <your-branch>
```

然后在 GitHub 发起 PR（推荐），确认无误后再合并到 `main`。

## 3. 提交前检查清单

- 只提交与本次任务相关的文件。
- 不提交密钥、账号、私密配置。
- 不提交临时测试垃圾文件。
- 确认关键功能可运行（至少手动跑一遍核心路径）。
- 提交信息写清楚“为什么改”。

## 4. 回档与撤销（重点）

### 4.1 查看历史

```bash
git log --oneline --graph --decorate -20
```

### 4.2 推荐撤销方式：`git revert`

```bash
git revert <commit-id>
```

说明：会新增一个“反向提交”，安全、可追踪，适合已推送到远端的提交。

### 4.3 本地强制回到旧版本（谨慎）

```bash
git reset --hard <commit-id>
```

说明：会丢弃当前未保存改动。除非你明确要抛弃本地修改，否则不要用。

## 5. 版本锚点（强烈建议）

在“确认稳定可用”的时间点打 tag：

```bash
git tag v0.1-wangyou-stable
git push origin v0.1-wangyou-stable
```

后续出现问题时，可以快速定位并回退到稳定里程碑。

## 6. 给 AI 的执行约束模板（可直接复制）

在让 AI 修改 `src/wangyou` 前，附加如下要求：

```text
按“src/wangyou/GitHub上传与回档操作指南.md”执行：
1) 先检查当前 git 状态并创建功能分支；
2) 小步修改并小步提交；
3) 不得使用 git reset --hard、git push --force；
4) 提交前给出变更文件列表与运行结果；
5) 最后提供可回档的 commit id。
```

## 7. 当前仓库实践建议

- `main` 只保留可运行版本。
- 所有开发改动都在分支进行。
- 任何“高风险重构”前先打 tag。
- 出现异常优先 `git revert`，尽量避免改历史。

---

维护说明：本文是 `wangyou` 模块的工程流程规范。若流程有调整，请先更新本文，再执行新流程。
