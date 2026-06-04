# 当前执行入口

> **更新**：2026-06-04 — **宣传/上架搁置** · **v1.2.5 质量线已收口**

---

## 策略（已拍板）

- **不做**：短期渠道宣传、发文、上架推广节奏
- **要做**：代码与体验 — 产品足够好时自然会被发现
- **Git**：Agent 可直接 `git push`，无需每次确认

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.2.4** | ✅ Agent/索引/E2E | [RELEASE_NOTES_v1.2.4.md](./RELEASE_NOTES_v1.2.4.md) |
| **v1.2.5** | ✅ 质量/生态 E2E | [V1.2.5_KICKOFF.md](./V1.2.5_KICKOFF.md) |

---

## v1.2.5 交付（已完成）

| 阶段 | 文档 |
|------|------|
| F1 | [V1.2.5_F1_UI_E2E.md](./V1.2.5_F1_UI_E2E.md) |
| F2 | [V1.2.5_F2_PLUGIN_E2E.md](./V1.2.5_F2_PLUGIN_E2E.md) |
| F3 | [V1.2.5_F3_PATCH_CI.md](./V1.2.5_F3_PATCH_CI.md) · [ROADMAP_V1.2.x_PATCHES.md](./ROADMAP_V1.2.x_PATCHES.md) |

**门禁**：`npm run test:local` · `npm run test:e2e:local` · `npm run test:e2e:stack`

---

## 下一工程线（待定）

- **v1.2.4.x** 热修：见 [ROADMAP_V1.2.x_PATCHES.md](./ROADMAP_V1.2.x_PATCHES.md)
- **v1.2.6+** 规划：插件生态 2.0 / 平台运维 · 搁置 SSH/SSO/营销

---

## 本地验证

```bash
npm run test:local
npm run test:e2e:local
npm run dev:stack
```
