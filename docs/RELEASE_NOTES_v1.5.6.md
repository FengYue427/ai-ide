# Release Notes — v1.5.6 · 支付宝 Price 生产

> **Tag**：含于 **v1.5.7** 合并发布

## 北极星

国内 **付得出去** — 支付宝 checkout 金额与 `plans.ts` 一致。

## 定价（CNY / 月）

| 套餐 | plans.ts | Alipay `total_amount` |
|------|:--------:|:-----------------------:|
| Pro | **¥39** | `39.00` |
| Team | **¥79** | `79.00` |

## 交付

| 项 | 说明 |
|----|------|
| `cnPriceVerify.ts` | 校验 priceCny · fen · Alipay 字符串 |
| `npm run verify:alipay:prices` | 可选 `--production` 拒绝沙箱 |
| 文档 | `CN_PAYMENT_SETUP` · `billing:preflight` |
| E2E | `e2e/billing-cn.spec.ts` |

## 运维

1. 支付宝开放平台创建 **¥39 / ¥79** 月付产品（或与 checkout 金额一致）
2. 生产环境：`ALIPAY_SANDBOX`  unset · 配置 `PAYMENT_NOTIFY_URL`
3. `npm run verify:alipay:prices -- --production`

## 下一 patch

**v1.5.7** — 见 [RELEASE_NOTES_v1.5.7.md](./RELEASE_NOTES_v1.5.7.md)
