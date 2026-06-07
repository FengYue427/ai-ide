# Paddle MoR 海外订阅配置（v1.6）

> **定位**：大陆开发者可用的 **Merchant of Record** — Paddle 作为法定卖家，代扣全球 VAT/GST，你无需 Stripe 境外主体。  
> **国内**：继续用 **支付宝**（`CN_PAYMENT_SETUP.md`）。  
> **定价**：Pro **$9.99/月** · Team **$19.99/月**（与 `lib/billing/plans.ts` 一致）。

---

## 1. 你需要做的事（Paddle 侧）

### 1.1 注册与 KYC

1. 打开 [Paddle Vendor](https://vendors.paddle.com/) 注册卖家账号  
2. 完成 **身份 / 企业 KYC**（如实填写；网站需可访问）  
3. 先在 **Sandbox** 联调，再切 **Live**

### 1.2 创建订阅产品（Sandbox → Live 各一套）

Paddle Dashboard → **Catalog → Products**：

| 产品 | 价格 | 周期 | 复制 Price ID |
|------|------|------|---------------|
| AI IDE Pro | **$9.99** | Monthly | → `PADDLE_PRICE_PRO` |
| AI IDE Team | **$19.99** | Monthly | → `PADDLE_PRICE_ENTERPRISE` |

Price ID 形如 `pri_01...`。

### 1.3 Webhook

Developer Tools → **Notifications → New destination**：

| 项 | 值 |
|----|-----|
| URL | `https://ai-ide-flame.vercel.app/api/subscription/paddle/webhook` |
| 事件 | `subscription.activated` · `subscription.updated` · `subscription.canceled` · `subscription.past_due` · `transaction.completed` |

复制 **Webhook secret** → `PADDLE_WEBHOOK_SECRET`。

### 1.4 网站要求（Account Setup → Website 表单）

| 字段 | URL |
|------|-----|
| 网站域名 | `https://ai-ide-flame.vercel.app` |
| 定价页 | `https://ai-ide-flame.vercel.app`（应用内订阅弹窗展示 $9.99 / $19.99） |
| **Terms of Service** | `https://ai-ide-flame.vercel.app/legal/terms-en.html` |
| **Privacy Policy** | `https://ai-ide-flame.vercel.app/legal/privacy-en.html` |
| **Refund Policy** | `https://ai-ide-flame.vercel.app/legal/refund-en.html` |

中文对照：`/legal/terms.html` · `/legal/privacy.html` · `/legal/refund.html`

---

## 2. Vercel Production 环境变量

```env
# Paddle Billing API（Sandbox 用 pdl_sdbx_apikey_...，Live 用 pdl_live_apikey_...）
PADDLE_API_KEY=pdl_sdbx_apikey_...
PADDLE_WEBHOOK_SECRET=...
PADDLE_PRICE_PRO=pri_...
PADDLE_PRICE_ENTERPRISE=pri_...

# 可选：显式指定 sandbox / live
# PADDLE_ENV=sandbox
```

**与支付宝并存时**（推荐双轨）：

- 保留 `ALIPAY_*`、`APP_URL`  
- **不要**删支付宝；前端按语言分流：中文 → 支付宝，其他 → Paddle

Redeploy Production 后生效。

---

## 3. 本地联调

`.env.local` 填入 Sandbox 密钥后：

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run db:neon
npm run dev:stack
```

1. 浏览器语言改为 **English**（或 `en-US`）  
2. 登录 → 订阅 → **Paddle 升级**  
3. Sandbox 测试卡完成付款  
4. 回跳 `/?subscription=success&plan=pro` → 套餐变 Pro  

Webhook 本地需隧道（类似支付宝 ngrok）：

```powershell
ngrok http 3001
# Paddle Notification URL 临时改为 https://xxx.ngrok-free.app/api/subscription/paddle/webhook
```

---

## 4. 代码行为（已实现）

| 能力 | 路径 |
|------|------|
| 海外 Checkout | `POST /api/subscription/checkout` `{ planId, channel: "paddle" }` |
| Webhook | `POST /api/subscription/paddle/webhook` |
| 客户门户 | `POST /api/subscription/portal`（Paddle 订阅用户） |
| 取消 | `POST /api/subscription/cancel`（同步 Paddle API） |
| 地区分流 | `lib/billing/billingRegion.ts` — `zh-CN` → 支付宝 |

校验：

```powershell
npm run verify:paddle:prices
npm run test:local -- lib/billing/paddleWebhook.test.ts lib/billing/billingRegion.test.ts
```

---

## 5. 验收清单

- [ ] Sandbox：`channel=paddle` 返回 checkout URL  
- [ ] 付完 webhook → 用户 `plan=pro`  
- [ ] 中文界面仍走支付宝 ¥39  
- [ ] 英文界面走 Paddle $9.99  
- [ ] Live：真实 $9.99 一笔 + 配额 2000/日  

---

## 6. 常见问题

| 问题 | 处理 |
|------|------|
| KYC 被拒 | 补全网站、隐私条款、产品说明；域名与 `APP_URL` 一致 |
| 海外用户仍看到支付宝 | 浏览器语言是否为 `zh-CN`；可改系统语言测试 |
| Webhook 401/400 | 检查 `PADDLE_WEBHOOK_SECRET` 与 Dashboard 一致 |
| 付完未升级 | Vercel Functions 日志搜 `[Paddle webhook]`；确认 DB 已 migrate paddle 列 |

---

## 相关

- [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md) — 国内支付宝  
- [STRIPE_SETUP.md](./STRIPE_SETUP.md) — 若有 HK 主体可选 Stripe  
- [PAYMENT_DECISION_GLOBAL_STRIPE.md](./PAYMENT_DECISION_GLOBAL_STRIPE.md)
