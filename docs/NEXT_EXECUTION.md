# 当前执行清单

> **1.0.4.x 总规划**：[V1.0.4.x_MASTER_PLAN.md](./V1.0.4.x_MASTER_PLAN.md) · **四级路线图**：[ROADMAP_V1.0.4.x.md](./ROADMAP_V1.0.4.x.md)

---

## 当前：1.0.4.x 世代（GA 后）

| 阶段 | 版本 | 状态 | 执行文档 |
|------|------|:----:|----------|
| 深化 | **1.0.4.1** E1′ MCP | ⏳ | [V1.0.4.1_EXECUTION.md](./V1.0.4.1_EXECUTION.md) |
| 深化 | **1.0.4.2** E2′ 感知 | ⏳ | [V1.0.4.2_EXECUTION.md](./V1.0.4.2_EXECUTION.md) |
| 主力 | **1.0.4.3** E3 检索 | ⏳ | [V1.0.4.3_EXECUTION.md](./V1.0.4.3_EXECUTION.md) |
| 收官 | **1.0.4.4** E4 | ⏳ | [V1.0.4.4_EXECUTION.md](./V1.0.4.4_EXECUTION.md) |

**推荐节奏**：W1 发 `v1.0.4.2`（合并 .1+.2）→ W2～3 做 **1.0.4.3** → W4 发 **`v1.0.4.4`**。

**闪击路径**：跳过 .1/.2 单独 tag，直接 **1.0.4.3 → 1.0.4.4**。

---

## 1.0.4 GA 收尾（并行）

| 项 | 状态 |
|----|:----:|
| 生产 `version=1.0.4` | ☐ |
| spotcheck + 人工 5 项 | ☐ |
| GitHub Release `v1.0.4` | ☐ |

---

## 命令

```powershell
cd C:\Users\18663\IDE\ai-ide
npm run test:local
npm run go-live:preflight
npm run rc:live-spotcheck
```
