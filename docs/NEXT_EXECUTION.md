# 当前执行入口

> **更新**：2026-06-04 — **v1.2.7 GA** · **下一：v1.2.8**

---

## 策略（已拍板）

- **不做**：短期渠道宣传、发文、上架推广节奏
- **要做**：代码与体验 — 产品足够好时自然会被发现
- **Git**：Agent 可直接 `git push`，无需每次确认

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.2.6** | ✅ GA · `v1.2.6` | [RELEASE_NOTES_v1.2.6.md](./RELEASE_NOTES_v1.2.6.md) |
| **v1.2.7** | ✅ GA · `v1.2.7` | [RELEASE_NOTES_v1.2.7.md](./RELEASE_NOTES_v1.2.7.md) |
| **v1.2.8** | 📋 规划 | [V1.2.8_KICKOFF.md](./V1.2.8_KICKOFF.md) |

---

## v1.2.8 下一工程线

| 阶段 | 文档 |
|------|------|
| F1 | [V1.2.8_F1_REFERENCES_UI.md](./V1.2.8_F1_REFERENCES_UI.md) |
| F2 | [V1.2.8_F2_AGENT_MCP.md](./V1.2.8_F2_AGENT_MCP.md) |
| F3 | [V1.2.8_F3_PLUGIN_PUBLISH.md](./V1.2.8_F3_PLUGIN_PUBLISH.md) |

**门禁**：`npm run test:local` · `npm run test:e2e:local` · `test:integration:local`（F3）

---

## v1.2.7 交付（GA）

| 阶段 | 文档 |
|------|------|
| F1 | [V1.2.7_F1_NAV_E2E.md](./V1.2.7_F1_NAV_E2E.md) |
| F2 | [V1.2.7_F2_PAYLOAD_PARITY.md](./V1.2.7_F2_PAYLOAD_PARITY.md) |
| F3 | [V1.2.7_F3_PLUGIN_PLATFORM.md](./V1.2.7_F3_PLUGIN_PLATFORM.md) |

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
