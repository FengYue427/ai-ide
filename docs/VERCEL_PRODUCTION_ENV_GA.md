# Vercel Production 环境变量核对表（D3 GA）

> 在 [Vercel Dashboard](https://vercel.com) → Project → **Settings** → **Environment Variables** → **Production** 逐项勾选。  
> 本地沙箱变量（`ALIPAY_SANDBOX=true`）**不要**复制到 Production。

---

## 必填

| 变量 | 示例 / 说明 | ☐ |
|------|-------------|---|
| `DATABASE_URL` | Neon `postgresql://...?sslmode=require` | ☐ |
| `AUTH_SECRET` | `npm run auth:secret` 生成 | ☐ |
| `APP_URL` | `https://ai-ide-flame.vercel.app`（无尾 `/`） | ☐ |
| `ALIPAY_APP_ID` | 开放平台 **生产** AppID | ☐ |
| `ALIPAY_PRIVATE_KEY` | 应用私钥 PEM 或 `ALIPAY_PRIVATE_KEY_PATH` | ☐ |
| `ALIPAY_PUBLIC_KEY` | 支付宝公钥 | ☐ |
| `BILLING_CRON_SECRET` | 随机 32+ 字符（或与 Vercel `CRON_SECRET` 一致） | ☐ |

## 强烈建议

| 变量 | 说明 | ☐ |
|------|------|---|
| `VITE_SENTRY_DSN` | 前端 Sentry | ☐ |
| `VITE_GA_LIVE` | `true` → 欢迎页显示「正式版」 | ☐ |

## 必须不存在或为 false

| 变量 | ☐ 已确认未设 |
|------|-------------|
| `ALIPAY_SANDBOX` | ☐ |
| `ALLOW_DEV_BILLING` | ☐ |
| `VITE_ALLOW_OFFLINE_AUTH` | ☐ |

## 支付宝开放平台（站外）

| 项 | 值 | ☐ |
|----|-----|---|
| 异步通知 | `https://ai-ide-flame.vercel.app/api/payment/alipay/notify` | ☐ |
| 同步返回 | 与 `paymentOrigin` / `npm run payment:notify-urls` 一致 | ☐ |

## 部署后验证

```powershell
$env:APP_URL="https://ai-ide-flame.vercel.app"
npm run smoke:report
node -e "fetch('https://ai-ide-flame.vercel.app/api/subscription/payment-methods').then(r=>r.json()).then(console.log)"
```

期望：`billingPath":"B"`，`alipay":true`（若仅支付宝）。

---

## 本地核对（有 `vercel env pull` 时）

```powershell
npm run check:release:d3
```
