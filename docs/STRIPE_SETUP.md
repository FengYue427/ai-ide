# Stripe 订阅配置清单

本文说明如何在 **开发** 与 **生产（Vercel）** 环境启用 AI IDE 的 Stripe 订阅。  
**手工验收步骤**见 [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md)。

## 1. Stripe Dashboard

1. 注册 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 切换到 **测试模式**（开发）或 **生产模式**（上线）
3. **Products** → 创建两个订阅产品（**USD 月付，须与 `lib/billing/plans.ts` 一致**）：
   - **Pro** — **$9.99 / month**
   - **Team**（代码名 `enterprise`）— **$19.99 / month**
4. 复制每个 Price 的 ID（形如 `price_1ABC...`）→ `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ENTERPRISE`

> 决策记录：[PAYMENT_DECISION_GLOBAL_STRIPE.md](./PAYMENT_DECISION_GLOBAL_STRIPE.md)

## 2. 环境变量

在 `.env.local`（本地）与 Vercel Project Settings → Environment Variables 中配置：

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL，订阅与用量落库 |
| `AUTH_SECRET` | 是 | JWT 签名 |
| `STRIPE_SECRET_KEY` | Stripe 模式 | `sk_test_...` 或 `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe 模式 | Webhook 签名密钥 `whsec_...` |
| `STRIPE_PRICE_PRO` | Stripe 模式 | Pro 月付 Price ID |
| `STRIPE_PRICE_ENTERPRISE` | Stripe 模式 | Enterprise 月付 Price ID |
| `APP_URL` | 推荐 | 前端地址，如 `https://ai-ide.vercel.app` |

未配置 Stripe 时，登录用户可使用 **dev_mock** 在开发环境直接升级（`NODE_ENV !== production` 或 `ALLOW_DEV_BILLING=true`）。

## 3. Webhook

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL（生产示例）：
   ```
   https://ai-ide-flame.vercel.app/api/subscription/webhook
   ```
   本地联调可用 [Stripe CLI](https://stripe.com/docs/stripe-cli)：
   ```bash
   stripe listen --forward-to localhost:3001/api/subscription/webhook
   ```
3. 订阅事件至少勾选：
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. 将 **Signing secret** 写入 `STRIPE_WEBHOOK_SECRET`

## 4. 本地联调流程

```bash
cp .env.local.example .env.local
# 填入 DATABASE_URL、AUTH_SECRET、STRIPE_* 

npm run db:setup
npm run dev:stack
```

1. 浏览器打开 `http://localhost:3000`，注册并登录
2. 升级 Pro：
   - **有 Stripe**：跳转 Checkout → 测试卡 `4242 4242 4242 4242`
   - **无 Stripe**：开发模式直接升级（dev_mock）
3. 成功回流 URL：`/?subscription=success&plan=pro`
4. 订阅管理：设置 → 订阅 → 取消 / 恢复 / 客户门户

## 5. API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/subscription` | 当前订阅 |
| GET | `/api/subscription/plans` | 套餐列表 |
| POST | `/api/subscription/checkout` | 创建结账 |
| POST | `/api/subscription/cancel` | 取消（`immediate` 可选） |
| POST | `/api/subscription/resume` | 撤销「周期末取消」 |
| POST | `/api/subscription/portal` | Stripe 客户门户 |
| POST | `/api/subscription/webhook` | Stripe Webhook |
| GET/POST | `/api/usage/ai` | AI 日用量查询/记录 |

## 6. 集成测试

```bash
npm run dev:api
API_BASE=http://127.0.0.1:3001 npm run test:integration
```

需 Postgres 与 `db:seed`。

## 7. 上线检查

- [ ] 生产 Stripe 密钥与 Price ID 已配置
- [ ] Webhook 指向生产域名且事件可达
- [ ] `APP_URL` 为正式前端域名
- [ ] `AUTH_SECRET` 为强随机值
- [ ] CI `integration-api` job 通过
