# 订阅生命周期（Phase 4 W8）

> 支付宝单次付款 = 30 天周期；到期后 **宽限期 3 天**，随后自动降为 **free**。

## 用户操作（订阅弹窗）

| 操作 | API | 行为 |
|------|-----|------|
| 周期结束后取消 | `POST /api/subscription/cancel` `{ immediate: false }` | `cancelAtPeriodEnd=true`，周期结束前仍可用 Pro |
| 恢复续费 | `POST /api/subscription/resume` | 清除 `cancelAtPeriodEnd` |
| 立即降级 | `POST /api/subscription/cancel` `{ immediate: true }` | 删除订阅记录，立刻 free |

## 自动到期

- **懒检查**：用户请求 `GET /api/subscription` 时，若 `currentPeriodEnd + 3 天 < 现在`，则降级并返回 `notice: "expired"`。
- **批量**：`GET|POST /api/billing/expire-subscriptions`（`Authorization: Bearer` 为 `CRON_SECRET` 和/或 `BILLING_CRON_SECRET` 之一即可，见 `lib/api/cronAuth.ts`）。
- **本地脚本**：`npm run billing:expire`（读 `.env.local` 的 `DATABASE_URL`）。

## 环境变量

```env
# Vercel Cron 使用自动生成的 CRON_SECRET（Bearer）
CRON_SECRET=vercel-generated
# 本地/CI 脚本可用另一串，不必与 CRON_SECRET 相同
BILLING_CRON_SECRET=manual-ops-secret
```

已在 `vercel.json` 配置每日 03:00 UTC 调用：

```json
{
  "crons": [{
    "path": "/api/billing/expire-subscriptions",
    "schedule": "0 3 * * *"
  }]
}
```

Vercel 会使用 **GET** 请求并携带 `Authorization: Bearer <CRON_SECRET>`（在 Vercel 项目环境变量中设置 `CRON_SECRET`）。

## 客户端提示

- 到期降级后 Chat 顶部显示黄色提示（`chat.subscriptionExpired`）。
- 配额随 `syncBillingFromServer` 刷新为 free 限额。

## QA

见 [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md) §订阅生命周期 W8。
