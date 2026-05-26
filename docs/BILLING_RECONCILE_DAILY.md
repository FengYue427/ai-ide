# 支付每日对账清单（D3 W9～W10）

> 与 [PHASE4_CN_PAYMENT.md](./PHASE4_CN_PAYMENT.md) · [BILLING_SUBSCRIPTION_LIFECYCLE.md](./BILLING_SUBSCRIPTION_LIFECYCLE.md) 配套。  
> **每周汇总**：复制 [WEEKLY_OPS_TEMPLATE.md](./WEEKLY_OPS_TEMPLATE.md)（v1.0.3+）。

## 每日（约 10 分钟）

| # | 动作 | 通过标准 |
|---|------|----------|
| 1 | 支付宝商户后台：昨日成功笔数 | 与 DB `PaymentOrder` status=paid 数量一致（±补单） |
| 2 | 抽查 1 笔：`npm run billing:reconcile -- <out_trade_no>` | 已 paid 则输出 already paid |
| 3 | `npm run billing:expire` 或 Cron 日志 | `{ expired: N }` 合理 |
| 4 | Vercel 日志：无连续 `/api/payment/*/notify` 5xx | — |

## 每周

| # | 动作 |
|---|------|
| 1 | 未支付 pending >24h 订单清理策略（人工标记） |
| 2 | 订阅 `cancelAtPeriodEnd` 与商户续费状态对照（Stripe 若有） |

## 环境

- 生产：`DATABASE_URL` 指向生产 Neon  
- Cron：`CRON_SECRET`（Vercel 自动生成）与/或 `BILLING_CRON_SECRET`（本地脚本）；二者可不同，见 `lib/api/cronAuth.ts`
- 验收：`npm run billing:verify-cron`（需 `APP_URL` + secret）

## 事故

| 现象 | 动作 |
|------|------|
| 用户已付款仍 free | `billing:reconcile` + 查 notify URL / ngrok 历史 |
| 重复扣款怀疑 | 查 `fulfillOrder` 幂等；订单 out_trade_no 唯一 |
