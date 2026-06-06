# Release Notes — v1.5.5 · Stripe Price 生产

> **Tag**：`v1.5.5`

## 北极星

海外 **付得出去** — Stripe Dashboard Price 与 `lib/billing/plans.ts` 一致。

## 定价（USD / 月）

| 套餐 | plans.ts | Stripe Dashboard |
|------|:--------:|:----------------:|
| Pro | **$9.99** | 须一致 |
| Team (`enterprise`) | **$19.99** | 须一致 |

## 交付

| 项 | 说明 |
|----|------|
| `stripePriceVerify.ts` | 比对 `unit_amount` 与 plans.ts |
| `npm run verify:stripe:prices` | 配置 `STRIPE_*` 后本地/CI 可选跑 |
| 文档 | `STRIPE_SETUP` · `PAYMENT_DECISION_GLOBAL_STRIPE` 更新为 v1.5 价 |
| E2E | `billing-skeleton.spec.ts` — $19.99 · 经济模型文案 |

## Vercel 必做

1. Stripe **live** 模式创建 $9.99 / $19.99 recurring Price
2. 写入 `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ENTERPRISE`
3. `npm run verify:stripe:prices` 通过

## 门禁

```bash
npm run test:local
npm run verify:stripe:prices
npm run test:e2e:local -- e2e/billing-skeleton.spec.ts
```

## 下一 patch

**v1.5.6** — 支付宝生产 · 见 [ROADMAP_V1.5.x_PATCHES.md](./ROADMAP_V1.5.x_PATCHES.md)
