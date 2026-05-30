# 当前执行入口

> **更新**：2026-05-30 — **v1.1.4 GA ✅**（deploy prod）· **v1.1.5 开波**

---

## 世代状态

| 线 | 状态 |
|----|------|
| **v1.1.3.x** | ✅ 冻结 |
| **v1.1.4** | ✅ **GA** · tag `v1.1.4` · [RELEASE_NOTES_v1.1.4.md](./RELEASE_NOTES_v1.1.4.md) |
| **v1.1.4.x** | 📋 热修线（见 [ROADMAP_V1.1.4.x_PATCHES.md](./ROADMAP_V1.1.4.x_PATCHES.md)） |
| **v1.1.5** | 🔄 **F1 规划** — 终端 + 任务 |

---

## v1.1.5 入口

| 文档 | 用途 |
|------|------|
| [V1.1.5_KICKOFF.md](./V1.1.5_KICKOFF.md) | 开波 + 现状审计 |
| [V1.1.5_MASTER_PLAN.md](./V1.1.5_MASTER_PLAN.md) | F1～F6 主规划 |
| [V1.1.5_GA_EXECUTION.md](./V1.1.5_GA_EXECUTION.md) | DoD 勾选 |
| [ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) | v1.1.5～9 长期 |

---

## 当前任务（F1）

1. **终端**：`Terminal.tsx` 输出面板 → 交互式 shell（WebContainer / Electron 双轨）
2. **npm scripts 面板**：脱离 Command Palette，底部面板可点跑
3. **任务面板**：`.aide/tasks.md` + spec tasks 从 Settings 迁出为独立侧栏/底栏

开发期版本号保持 **`1.1.4`**，F6 bump **`1.1.5`** 并 tag。

---

## 待发（可选）

```powershell
git push origin main
git push origin v1.1.4
```

`smoke:report` 5/5 需在可访问 Vercel 的网络补跑（本地 DNS 阻断非 prod 故障）。
