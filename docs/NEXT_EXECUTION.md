# 当前执行清单

> **当前版本**：**v1.1.2.3**（轨道 A · 后台 Agent 补丁 **1.1.2.1～.3**）  
> **基线**：**v1.1.2** 已部署（后台 Agent MVP）  
> **下一世代**：[ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md)

---

## 双轨一览

```
轨道 A   1.1.2.1～.3 ✅ 本地（通知 / IDE 应用 / Plan 桥接）
轨道 B   v1.1.2 ✅ 已部署
```

---

## 立即可做（发版）

```powershell
cd C:\Users\18663\IDE\ai-ide
npx prisma migrate deploy
npm run test:local
npm run build:deploy
# 手工：V1.1.2_MASTER_PLAN §4 黄金路径（VITE_BACKGROUND_AGENT=true）

git add .
git commit -m "release: v1.1.2 background agent MVP"
git push origin main
git tag v1.1.2
git push origin v1.1.2
# Vercel：VITE_BACKGROUND_AGENT、CRON_SECRET、migrate
npx vercel --prod --yes
npm run smoke:production
```

---

## v1.1.2 交付摘要

| 阶段 | 内容 |
|------|------|
| F1 | `BackgroundJob` + `/api/jobs` |
| F2 | Worker + Cron + 30min 超时 |
| F3 | `BackgroundJobsPanel` + Chat 后台运行 |
| F4 | Pro 配额 + 云回写 + Diff 预览 |
| F5 | `1.1.2` 版本号、CHANGELOG、README、Quickstart |

文档：[BACKGROUND_AGENT_QUICKSTART.md](./BACKGROUND_AGENT_QUICKSTART.md)

---

## v1.1.2.1～.3 交付摘要

| patch | 内容 |
|-------|------|
| 1.1.2.1 | 完成 Toast/桌面通知、工具栏与 Tab 徽章 |
| 1.1.2.2 | **应用到 IDE** 一键合并 pendingChanges |
| 1.1.2.3 | Plan 目录 **后台运行** → `/api/jobs` |

**下一轨道 B 大更新**：v1.1.3（协作 **或** 网关，二选一）。
