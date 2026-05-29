# 当前执行清单

> **当前版本**：**v1.1.2**（轨道 B · 后台 Agent MVP · **F1～F5 本地完成**）  
> **发版**：见 [V1.1.2_GA_EXECUTION.md](./V1.1.2_GA_EXECUTION.md) §1（GA2-10～12 需你手工 / push）  
> **下一世代**：[ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md)

---

## 双轨一览

```
轨道 A   1.1.1.10～.13 ✅ 本地（可与 1.1.2 一并 push）
轨道 B   v1.1.2 ✅ F1～F5 代码就绪 ──► 待 tag + deploy
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

## GA 之后（轨道 A 可选）

| patch | 主题 |
|-------|------|
| 1.1.2.1 | 后台任务通知、小抛光 |
| 1.1.2.x | Plan 桥接后台（非 MVP） |

**下一轨道 B 大更新**：v1.1.3（协作 **或** 网关，二选一）。
