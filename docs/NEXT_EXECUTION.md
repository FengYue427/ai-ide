# 当前执行清单

> **短规划**：[PLAN_SHORT_V1.0.3-V1.0.4.md](./PLAN_SHORT_V1.0.3-V1.0.4.md) · **长远**：[ROADMAP_V1.1.md](./ROADMAP_V1.1.md)

---

## A. 1.0.3.5 — S5 运维收口（当前）

| 项 | 状态 |
|----|:----:|
| 版本 bump + 稳定版徽章 | ✅ |
| 部署 `version=1.0.3.5` | ☐ |
| spotcheck 自动项 | ☐ |
| 人工 5 项 | ☐ |
| [V1.0.3.5_OPS_CLOSURE.md](./V1.0.3.5_OPS_CLOSURE.md) | ☐ |
| 关 1.0.3.x milestone | ☐ |
| 可选 `v1.0.3` GA | ☐ |

**执行**：[V1.0.3.5_EXECUTION.md](./V1.0.3.5_EXECUTION.md)

---

## B. v1.0.4 主版本（并行 Kickoff）

| 文档 / 交付 | 状态 |
|-------------|:----:|
| [V1.0.4_MASTER_PLAN.md](./V1.0.4_MASTER_PLAN.md) | ✅ |
| [V1.0.4_KICKOFF.md](./V1.0.4_KICKOFF.md) | ✅ |
| MCP 官方预置 UI | 🔶 已合入 main，待 `1.0.4-rc.1` 验收 |
| [V1.0.4.1_EXECUTION.md](./V1.0.4.1_EXECUTION.md) | ✅ |
| 规则编辑流 / Agent 感知 | ☐ |

**前置**：建议 **1.0.3.5** milestone 关闭后再打 `1.0.4-rc.1`。

---

## C. 1.0.4.x（GA 后）

[ROADMAP_V1.0.4.x.md](./ROADMAP_V1.0.4.x.md)

---

## 命令速查

```powershell
cd C:\Users\18663\IDE\ai-ide
npm run test:local
npm run go-live:preflight
npm run rc:live-spotcheck
npm run ops:verify-p1
```
