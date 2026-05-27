# 当前执行清单

> **短规划**：[PLAN_SHORT_V1.0.3-V1.0.4.md](./PLAN_SHORT_V1.0.3-V1.0.4.md)

---

## A. 1.0.3.5 运维收口

| 项 | 状态 |
|----|:----:|
| 代码 / tag `v1.0.3.5` | ✅ |
| 部署 + spotcheck | ☐ |
| [V1.0.3.5_OPS_CLOSURE.md](./V1.0.3.5_OPS_CLOSURE.md) | ☐ |

---

## B. 1.0.4-rc.1（当前发版）

| 项 | 状态 |
|----|:----:|
| MCP 官方预置 | ✅ |
| 规则 + Agent 上下文 | ✅ |
| 部署 `version=1.0.4-rc.1` | ☐ |
| `go-live:preflight` + spotcheck | ☐ |
| tag `v1.0.4-rc.1` push | ☐ |

**执行**：[V1.0.4_KICKOFF.md](./V1.0.4_KICKOFF.md) Phase 2

---

## C. 1.0.4 GA → 1.0.4.x

[V1.0.4_KICKOFF.md](./V1.0.4_KICKOFF.md) Phase 3 · [ROADMAP_V1.0.4.x.md](./ROADMAP_V1.0.4.x.md)

---

## 命令

```powershell
cd C:\Users\18663\IDE\ai-ide
npm run test:local
npm run go-live:preflight
npm run rc:live-spotcheck
```
