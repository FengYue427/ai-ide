# 1.0.5.x 附属路线图（1.0.5.1 → 1.0.5.4）

> **前置**：**1.0.4.x** 收官 `v1.0.4.4` ✅  
> **总规划**：[V1.0.5.x_MASTER_PLAN.md](./V1.0.5.x_MASTER_PLAN.md) · **主版本**：[V1.0.5_MASTER_PLAN.md](./V1.0.5_MASTER_PLAN.md)  
> **下一世代**：[ROADMAP_V1.1.md](./ROADMAP_V1.1.md)

---

## 0. 与 1.0.5 主版本的关系

**1.0.5** = 桥接 Kickoff（版本策略、竞品维持 ~2.80）。  
**1.0.5.x 四级** = 运营债 + 质量 UX + v1.1 文档准备 + 世代收官。

---

## 1. 四级总览

| 版本 | 代号 | 状态 | 主题（一句话） | 建议 tag |
|:----:|------|:----:|----------------|----------|
| **1.0.5** | — | 🔶 | 桥接 Kickoff | `v1.0.5` |
| **1.0.5.1** | **B1′ 运维+MCP** | 🔶 | `mcp:smoke`、MCP FAQ | **`v1.0.5.1`** |
| **1.0.5.2** | **B2′ 索引@** | ⏳ | building 禁用 `@`、边界链接锚点 | `v1.0.5.2` |
| **1.0.5.3** | **C1′ v1.1 预备** | ⏳ | RFC、flags、欢迎页 Release | `v1.0.5.3` |
| **1.0.5.4** | **E5 收官** | ⏳ | live、milestone、发布 | **`v1.0.5.4`** |

> **1.0.5.x 在 1.0.5.4 结束后不再新增第四段**；下一主规划为 **v1.1.0**。

---

## 2. 1.0.5.1 — B1′ 运维 + MCP

> **执行**：[V1.0.5.1_EXECUTION.md](./V1.0.5.1_EXECUTION.md)

| ID | 交付 | 验收 |
|----|------|------|
| 5.1-1 | `npm run mcp:smoke` | 脚本 + package.json |
| 5.1-2 | MCP FAQ（localhost/CORS/401） | MCP_OFFICIAL_CATALOG §故障 |
| 5.1-3 | `package.json` → **1.0.5.1** | health / spotcheck |
| 5.1-4 | 运营 checklist 复用（Sentry/对账记录位） | V1.0.5_KICKOFF Phase 1 |

---

## 3. 1.0.5.2 — B2′ 索引与 @

> **执行**：[V1.0.5.2_EXECUTION.md](./V1.0.5.2_EXECUTION.md)

| ID | 交付 | 验收 |
|----|------|------|
| 5.2-1 | 索引 **building** 时禁用 `@` 列表 + 提示 | Chat 手测 |
| 5.2-2 | 设置页索引卡片链到 `BROWSER_LIMITATIONS#capacity-limits` | 链接有效 |
| 5.2-3 | i18n 中英 | translations |

---

## 4. 1.0.5.3 — C1′ v1.1 预备

> **执行**：[V1.0.5.3_EXECUTION.md](./V1.0.5.3_EXECUTION.md)

| ID | 交付 | 验收 |
|----|------|------|
| 5.3-1 | [V1.1_RFC_STUB.md](./V1.1_RFC_STUB.md) 扩写 | 可评审 |
| 5.3-2 | [ROADMAP_V1.1.x.md](./ROADMAP_V1.1.x.md) 细化 | 四级表 |
| 5.3-3 | 欢迎页 Release Notes 链接 | `v{version}` tag URL |

---

## 5. 1.0.5.4 — E5 收官

> **执行**：[V1.0.5.4_EXECUTION.md](./V1.0.5.4_EXECUTION.md)

| ID | 交付 | 验收 |
|----|------|------|
| 5.4-1 | live 人工 5/5 | RC_LIVE_SPOTCHECK |
| 5.4-2 | GitHub Release `v1.0.5.4` | Release Notes |
| 5.4-3 | 关 1.0.4.x / 开 v1.1 milestone | — |
| 5.4-4 | publish 渠道 **1.0.5.4** 表述 | CSDN/掘金 |
| 5.4-5 | [NEXT_EXECUTION.md](./NEXT_EXECUTION.md) → v1.1 Kickoff | — |

---

## 6. 门禁

```powershell
npm run test:local
npm run go-live:preflight
npm run mcp:smoke
npm run rc:live-spotcheck
```
