# 当前执行清单

> **1.0.5.x**：[V1.0.5.x_MASTER_PLAN.md](./V1.0.5.x_MASTER_PLAN.md) · **路线图**：[ROADMAP_V1.0.5.x.md](./ROADMAP_V1.0.5.x.md)

---

## 当前：1.0.5.x（`v1.0.5.1` 进行中）

| 版本 | 代号 | 状态 | 执行文档 |
|------|------|:----:|----------|
| **1.0.5** | 桥接 Kickoff | 🔶 | [V1.0.5_KICKOFF.md](./V1.0.5_KICKOFF.md) |
| **1.0.5.1** | B1′ 运维+MCP | 🔶 | [V1.0.5.1_EXECUTION.md](./V1.0.5.1_EXECUTION.md) |
| **1.0.5.2** | B2′ 索引@ | ⏳ | [V1.0.5.2_EXECUTION.md](./V1.0.5.2_EXECUTION.md) |
| **1.0.5.3** | C1′ v1.1 预备 | ⏳ | [V1.0.5.3_EXECUTION.md](./V1.0.5.3_EXECUTION.md) |
| **1.0.5.4** | E5 收官 | ⏳ | [V1.0.5.4_EXECUTION.md](./V1.0.5.4_EXECUTION.md) |

**本包已合入（1.0.5.1）**：`mcp:smoke`、MCP FAQ、索引 building 时 `@` 禁用、设置页 `#capacity-limits`、欢迎页 Release 链接。

**下一步**：deploy → `v1.0.5.1` tag → 继续 .3 RFC / .4 收官。

---

## 待办（可并行）

| 项 | 状态 |
|----|:----:|
| live 人工 5/5 | ☐ |
| GitHub Release `v1.0.5.1` | ☐ |
| 关 **1.0.4.x** milestone | ☐ |

---

## 命令

```powershell
cd C:\Users\18663\IDE\ai-ide
npm run test:local
npm run mcp:smoke
npm run go-live:preflight
npm run rc:live-spotcheck
```
