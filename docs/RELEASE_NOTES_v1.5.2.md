# Release Notes — v1.5.2 · 生产 GA · Tab++ 默认开

> **日期**：2026-06-05 · **含 v1.5.1 部署项** · **前置**：v1.5.0

---

## v1.5.1 — 生产部署

- **`.env.production`**：Vite 生产 build 默认写入 v1.5 全开 env
- **`verify:env:v15`**：`scripts/verify-env.mjs --production --v15-production` 校验 VITE_* 与 BYOK 关闭
- **`v15ProductionEnv.ts`**：部署 catalog（与 `V1.5_ENV.md` 对齐）
- **欢迎页**：onboarding 文案去掉「自带 Key」；平台 CTA `data-testid="welcome-platform-cta"`
- **`releaseVersion` FALLBACK** → **1.5.2**

## v1.5.2 — Tab++ 生产 GA

- **特性开关**：production build 默认开启 v1.5 flags（`VITE_*=false` 可显式关闭）
- **P95 目标**：Tab++ 生产模式 **400ms**（与 POC 一致；默认 Tab 仍为 800ms）
- **设置页**：Tab 补全卡显示 P95 采集提示（`settings-tab-p95-hint`）
- **debounce**：Tab++ 生产 **250ms**（已有，文档与指标卡对齐）

---

## 验收

| 项 | 命令 / 位置 |
|----|-------------|
| 单测 | `npm run test:unit` ≥789 |
| v1.5 env | `npm run verify:env:v15` |
| Tab++ E2E | `e2e/tab-plus-plus.spec.ts` |
| 执行清单 | [V1.5.1_GA_EXECUTION.md](./V1.5.1_GA_EXECUTION.md) |

---

## 下一 patch

**v1.5.3** — Runtime 抛光 · 见 [ROADMAP_V1.5.x_PATCHES.md](./ROADMAP_V1.5.x_PATCHES.md)
