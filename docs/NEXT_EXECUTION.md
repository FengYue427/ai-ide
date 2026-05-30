# 当前执行入口

> **更新**：2026-05-29 — **v1.1.5 GA ✅** · tag `v1.1.5`

---

## 世代状态

| 线 | 状态 |
|----|------|
| **v1.1.3.x** | ✅ 冻结 |
| **v1.1.4** | ✅ **GA** · tag `v1.1.4` · [RELEASE_NOTES_v1.1.4.md](./RELEASE_NOTES_v1.1.4.md) |
| **v1.1.4.x** | 📋 热修线（见 [ROADMAP_V1.1.4.x_PATCHES.md](./ROADMAP_V1.1.4.x_PATCHES.md)） |
| **v1.1.5** | ✅ **GA** · tag `v1.1.5` · [RELEASE_NOTES_v1.1.5.md](./RELEASE_NOTES_v1.1.5.md) |
| **v1.1.5.x** | 📋 patch 线（终端/底栏热修） |
| **v1.1.6** | 📋 规划 — Git 可视化 |

---

## v1.1.5 入口

| 文档 | 用途 |
|------|------|
| [V1.1.5_KICKOFF.md](./V1.1.5_KICKOFF.md) | 开波 + 现状审计 |
| [V1.1.5_MASTER_PLAN.md](./V1.1.5_MASTER_PLAN.md) | F1～F6 主规划 |
| [V1.1.5_GA_EXECUTION.md](./V1.1.5_GA_EXECUTION.md) | DoD 勾选 |
| [RELEASE_NOTES_v1.1.5.md](./RELEASE_NOTES_v1.1.5.md) | 对外 Release 文案 |
| [ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) | v1.1.5～9 长期 |

---

## 当前任务（v1.1.6 Kickoff）

1. Git 可视化 / diff 面板规划（见长期路线图）
2. 手测补项：WebContainer 交互终端 · Scripts 跑 script · Tasks 跳转（GA DoD 可选）
3. `smoke:report` 5/5（网络允许时）

---

## 发版命令（已执行）

```powershell
git push origin main
git push origin v1.1.5
npm run deploy
```

`smoke:report` 需在可访问 Vercel 的网络补跑（本地 DNS 阻断非 prod 故障）。
