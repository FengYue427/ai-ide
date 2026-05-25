# D3 GA 生产部署（Path B）

> RC 公测为 Path A（可无商户）。GA 切换 Path B 时按本页执行。

---

## 1. 前置

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run d3:preflight
```

本地 `.env.local` 仅用于开发；**生产变量在 Vercel → Production**。

---

## 2. Vercel Production 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Neon/Postgres |
| `AUTH_SECRET` | 与现网一致或轮换计划 |
| `APP_URL` | `https://ai-ide-flame.vercel.app`（无尾斜杠） |
| `ALIPAY_*` | 生产 AppID、私钥、公钥（**关闭** `ALIPAY_SANDBOX`） |
| `BILLING_CRON_SECRET` | `openssl rand -hex 32` |
| `VITE_SENTRY_DSN` | Sentry 项目 DSN（前端） |
| `VITE_APP_VERSION` | 可选；构建时由 `package.json` 注入 |
| `VITE_GA_LIVE` | `true` — 欢迎页显示「正式版」徽章 |

**必须关闭**：`ALLOW_DEV_BILLING`、`ALIPAY_SANDBOX`、`VITE_ALLOW_OFFLINE_AUTH`

微信（可选 GA）：`WECHAT_MCH_ID` 等 — 未就绪可支付宝-only。

---

## 3. Cron

`vercel.json` 已含：

```json
{ "path": "/api/billing/expire-subscriptions", "schedule": "0 3 * * *" }
```

Vercel 将 `CRON_SECRET` 注入请求；也可单独设置 `BILLING_CRON_SECRET`（与 handler 一致）。

---

## 4. 部署命令

```powershell
npm run build:deploy
npx vercel --prod
APP_URL=https://ai-ide-flame.vercel.app npm run deploy:check
APP_URL=https://ai-ide-flame.vercel.app npm run smoke:report
```

---

## 5. GA 后 72h

- 每日：`npm run billing:reconcile`（或 SOP 手工）
- Sentry 告警收件箱
- [D3_GA_ACCEPTANCE.md](./D3_GA_ACCEPTANCE.md) 生产段签字

回滚：Vercel 上一 Deployment Promote；必要时 Path A（移除商户 env，保留用户数据）。
