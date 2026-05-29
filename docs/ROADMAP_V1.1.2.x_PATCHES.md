# v1.1.2.x 补丁（轨道 A）

> GA **v1.1.2** 之后的小版本，第四段 `1.1.2.1` 起。与 **v1.1.3 大更新** 分开。

| 版本 | 主题 | 状态 |
|------|------|------|
| **1.1.2.1** | 后台任务完成通知、工具栏/Tab 徽章 | ✅ |
| **1.1.2.2** | 一键 **应用到 IDE**（`pendingChanges`） | ✅ |
| **1.1.2.3** | Plan 目录 **后台运行** → `POST /api/jobs` | ✅ |
| **1.1.2.4** | 重试、筛选、Plan 步骤回填 | ✅ |

## 启用

生产需 `VITE_BACKGROUND_AGENT=true`（与 v1.1.2 相同）。见 [BACKGROUND_AGENT_QUICKSTART.md](./BACKGROUND_AGENT_QUICKSTART.md)。

## 发版

由 Agent 自动：`npm run build:deploy` → `git push` → `npx vercel --prod --yes`。
