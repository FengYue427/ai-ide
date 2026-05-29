# 当前执行清单

> **当前稳定**（本地）：**v1.1.1**（计划系统 GA）  
> **下一 P0**：[ROADMAP_V1.1.md](./ROADMAP_V1.1.md) — 后台 Agent 队列 **或** 协作 M1（二选一）  
> **GA 清单**：[V1.1.1_GA_EXECUTION.md](./V1.1.1_GA_EXECUTION.md) · **发版**：[RELEASE_RUNBOOK.md](./RELEASE_RUNBOOK.md)

---

## v1.1.1 计划系统 GA — 状态

| 阶段 | 状态 |
|------|------|
| v1.1.0.5～0.20 功能 | ✅ 本地完成 |
| v1.1.1.1～1.1.1.8 附属 | ✅ 本地完成 |
| v1.1.1.9 文档收口 | ✅ `V1.1.1_GA_EXECUTION` / Quickstart / README / CHANGELOG |
| `package.json` = **1.1.1** | ✅ |
| `npm run test:local` | ✅ 105 files / 339 tests |
| `git tag` + 生产部署 | ☐ 待用户确认后执行 |

---

## 发版（待执行）

```powershell
cd C:\Users\18663\IDE\ai-ide
npm run test:local
npm run build:deploy
npm run go-live:preflight
# 手工黄金路径见 V1.1.1_GA_EXECUTION.md §3

git add .
git commit -m "release: v1.1.1 plan system GA"
git push origin main
git tag v1.1.1
git push origin v1.1.1
npx vercel --prod --yes   # 网络可达时
```

---

## v1.1.2+（GA 之后）

后台 Agent 队列（P0-A）或协作 M1（P0-B）— **最多同时 1 个 P0**。
