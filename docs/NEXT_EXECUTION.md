# 当前执行清单

> **v1.0.6** 已收官 → **v1.1**：[ROADMAP_V1.1.md](./ROADMAP_V1.1.md) · [V1.0.6_MASTER_PLAN.md](./V1.0.6_MASTER_PLAN.md)

---

## 当前：v1.1 Kickoff

| 阶段 | 状态 |
|------|:----:|
| **1.0.6.1–1.0.6.4** | ✅ 代码 + 文档 |
| **1.0.6.3/6.4 push + live** | 🔶 本机 `git push` + spotcheck |
| **v1.1 规划落地** | ⏳ |

**建议第一步**：阅读 [ROADMAP_V1.1.md](./ROADMAP_V1.1.md)，确定 1.1.1 首个可见交付（后台 Agent / Tab++ / 协作等择一）。

---

## 部署（若尚未 push）

```powershell
cd C:\Users\18663\IDE\ai-ide
git push origin main
git push origin v1.0.6.3
git push origin v1.0.6.4
npm run rc:live-spotcheck
```

确认 `health.version` = **1.0.6.4**。

---

## 门禁

```powershell
npm run test:local
npm run mcp:smoke
npm run go-live:preflight
```
