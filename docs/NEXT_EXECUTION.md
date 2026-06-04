# 当前执行入口

> **更新**：2026-06-05 — **v1.2.9 GA** · **下一：v1.3 F1**

---

## 策略（已拍板）

- **不做**：短期渠道宣传、发文、上架推广节奏
- **要做**：代码与体验 — 产品足够好时自然会被发现
- **Git**：Agent 可直接 `git push`，无需每次确认

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.2.9** | ✅ GA · `v1.2.9` | [RELEASE_NOTES_v1.2.9.md](./RELEASE_NOTES_v1.2.9.md) |
| **v1.3** | 📋 规划 | [V1.3_KICKOFF.md](./V1.3_KICKOFF.md) · [ROADMAP_V1.3.md](./ROADMAP_V1.3.md) |

---

## v1.3 下一工程线（规划）

| 阶段 | 主题 | 文档 |
|------|------|------|
| **F1** | Python / LSP 试点 | [V1.3_MASTER_PLAN.md](./V1.3_MASTER_PLAN.md) §2 |
| **F2** | 索引 2.0 | §3 |
| **F3** | 后台 Agent GA | §4 |

**门禁**：`npm run test:local` · `test:e2e:stack` · [V1.2.9_GA_EXECUTION.md](./V1.2.9_GA_EXECUTION.md) 生产 smoke

---

## v1.2.9 交付（GA）

| 阶段 | 文档 |
|------|------|
| F1 | [V1.2.9_F1_REFERENCES_PRECISION.md](./V1.2.9_F1_REFERENCES_PRECISION.md) |
| F2 | [V1.2.9_F2_MCP_METER.md](./V1.2.9_F2_MCP_METER.md) |
| F3 | [V1.2.9_F3_PLUGIN_OPS.md](./V1.2.9_F3_PLUGIN_OPS.md) |

---

## v1.2.8 交付（GA）

| 阶段 | 文档 |
|------|------|
| F1 | [V1.2.8_F1_REFERENCES_UI.md](./V1.2.8_F1_REFERENCES_UI.md) |
| F2 | [V1.2.8_F2_AGENT_MCP.md](./V1.2.8_F2_AGENT_MCP.md) |
| F3 | [V1.2.8_F3_PLUGIN_PUBLISH.md](./V1.2.8_F3_PLUGIN_PUBLISH.md) |

---

## 热修

- **v1.2.4.x** patch：见 [ROADMAP_V1.2.x_PATCHES.md](./ROADMAP_V1.2.x_PATCHES.md)

---

## 本地验证

```bash
npm run test:local
npm run test:e2e:local
npm run dev:stack
```
