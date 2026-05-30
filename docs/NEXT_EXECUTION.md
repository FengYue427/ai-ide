# 当前执行入口

> **更新**：2026-05-29 — **v1.1.5 GA ✅** · **1.1.5.1 patch 进行中**

---

## 世代状态

| 线 | 状态 |
|----|------|
| **v1.1.5** | ✅ **GA** · tag `v1.1.5` · [RELEASE_NOTES_v1.1.5.md](./RELEASE_NOTES_v1.1.5.md) |
| **v1.1.5.x** | 🔄 **1.1.5.1 ✅** — 见 [ROADMAP_V1.1.5.x_PATCHES.md](./ROADMAP_V1.1.5.x_PATCHES.md) |
| **v1.1.6** | 📋 规划 — Git 可视化 |

---

## 当前任务（1.1.5.2）

1. **Scripts 运行反馈**：失败 Toast、last-run 状态
2. 手测：底栏拖拽后终端换行是否正常
3. `smoke:report` 5/5（网络允许时）

---

## v1.1.5.x 入口

| 文档 | 用途 |
|------|------|
| [ROADMAP_V1.1.5.x_PATCHES.md](./ROADMAP_V1.1.5.x_PATCHES.md) | patch backlog |
| [V1.1.5_GA_EXECUTION.md](./V1.1.5_GA_EXECUTION.md) | GA DoD |
| [ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) | v1.1.6+ |

---

## 发版（1.1.5.1）

```powershell
npm run test:local
git push origin main
npm run deploy
```

可选：`node scripts/publish-github-release.mjs v1.1.5.1 "v1.1.5.1 — 终端 resize 热修" docs/...`（小 patch 通常仅 CHANGELOG）
