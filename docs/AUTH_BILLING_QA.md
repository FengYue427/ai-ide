# 登录注册 & Stripe 购买 — 自检清单

上线 Vercel 前，在本地用 **`npm run dev:stack`**（Neon + API 3001）按本清单走一遍。

---

## 一、登录 / 注册（邮箱密码）

| 步骤 | 操作 | 期望 |
|------|------|------|
| 1 | 欢迎页 → 登录 → **创建账号** | 8 位以上密码，格式错误有提示 |
| 2 | 注册成功 | 自动登录，顶栏显示邮箱 |
| 3 | 刷新页面 `F5` | 仍保持登录（`auth-token` Cookie） |
| 4 | 设置 → 退出登录 | 云端工作区不可用 |
| 5 | 用同一邮箱登录 | 成功 |
| 6 | 错误密码 | 「邮箱或密码错误」 |
| 7 | 重复注册 | 「邮箱已注册」 |

**自动化：** `npm run test:integration:local`（覆盖 register / session / login / signout）

### 环境要求

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Neon 连接串（`npm run db:neon` 已建表） |
| `AUTH_SECRET` | 本地 `.env.local` 必填；生产必须另生成，不可用默认值 |

### 已知限制

- **找回密码**：接口为演示，**不会发真实邮件**；界面会提示暂未接入邮件。
- **OAuth（GitHub / Google·Gmail）**：需 `VITE_ENABLE_OAUTH=true` + 服务端 `AUTH_*` + `AUTH_URL`/`APP_URL`；路由 `/api/auth/oauth/*`，回站 `?oauth_sync=1` 同步 JWT。配置见 [OAUTH_SETUP.md](./OAUTH_SETUP.md)。
- **仅 `npm run dev`（无 API）**：可走浏览器本地账号（`VITE_ALLOW_OFFLINE_AUTH`）；**生产构建禁止**离线注册。

---

## 二、支付宝 / 微信购买（国内）

配置见 **[CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md)**。

| 步骤 | 操作 | 期望 |
|------|------|------|
| 1 | 登录 → 升级 Pro → **支付宝 / 微信升级** | 弹出支付窗 |
| 2 | 支付宝 | 跳转收银台，付款后回到站点并显示 Pro |
| 3 | 微信 | 展示二维码，扫码后自动升级 |

未配置商户时，本地 `dev:stack` 仍可用 **dev_mock** 假升级。  
骨架验收见 [BILLING_SKELETON.md](./BILLING_SKELETON.md)（`npm run check:skeleton`）。

---

## 三、Stripe 购买（可选 / 海外）

### 2.1 环境变量（`.env.local`）

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...    # 来自 stripe listen
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
APP_URL=http://localhost:3000
```

**不要**设 `ALLOW_DEV_BILLING`（否则走 dev_mock 假升级，不会测到真 Stripe）。

### 2.2 启动 Webhook 转发（单独终端）

```bash
stripe listen --forward-to localhost:3001/api/subscription/webhook
```

把输出的 `whsec_...` 写入 `STRIPE_WEBHOOK_SECRET`，重启 `npm run dev:stack`。

### 2.3 手工流程

| 步骤 | 操作 | 期望 |
|------|------|------|
| 1 | 登录后 → 升级 Pro | 跳转 Stripe Checkout（test 卡 `4242...`） |
| 2 | 支付完成回站 | Toast「订阅成功」；约几秒内计划变为 **pro** |
| 3 | 打开订阅弹窗 | 当前计划 Pro；AI 配额升高 |
| 4 | 「管理账单」 | 打开 Stripe Customer Portal（需已有 `stripeCustomerId`） |
| 5 | 周期末取消 | `cancelAtPeriodEnd=true`，到期前仍可用 |
| 6 | 恢复订阅 | 取消「周期末取消」 |

**测试卡：** `4242 4242 4242 4242` · 任意未来日期 · 任意 CVC

### 2.4 无 Stripe 时的开发模式

未配置 `STRIPE_SECRET_KEY` 且 `NODE_ENV !== production` 时，结账走 **dev_mock**，集成测试 `checkout dev_mock` 会通过。

**Vercel 生产：** 必须配置全套 `STRIPE_*`，且 **禁止** `ALLOW_DEV_BILLING`。

---

## 三、常见问题

| 现象 | 原因 / 处理 |
|------|-------------|
| 注册 500 | `DATABASE_URL` 未设或 Neon 不可达 → `npm run db:neon` |
| 登录后刷新掉线 | `AUTH_SECRET` 变更后旧 Cookie 失效；重新登录 |
| 结账 401 | 未登录；先注册/登录 |
| 结账 503「支付功能尚未配置」 | 生产未配 Stripe 且未允许 dev_mock |
| 支付成功仍显示 free | Webhook 未收到 → 检查 `stripe listen`、URL、`STRIPE_WEBHOOK_SECRET`；等待几秒或刷新 |
| `STRIPE_PRICE_PRO` 报错 | Price ID 与 Dashboard 不一致（test/live 模式要一致） |
| 客户门户打不开 | 需先完成一次 Stripe 结账才有 `stripeCustomerId` |

---

## 四、推荐命令（提交前）

```bash
npm run test:unit
npm run test:integration:local   # 需 dev:stack 或 dev:api + DATABASE_URL
```

配置 Stripe 后可用 Dashboard → Webhooks →「Send test webhook」→ `checkout.session.completed` 验证端点。

---

## 五、Vercel 生产额外项

| 项 | 说明 |
|----|------|
| `AUTH_SECRET` | 新生成，与本地不同 |
| `APP_URL` | `https://你的域名.vercel.app`（Checkout 回跳依赖） |
| Webhook URL | `https://你的域名/api/subscription/webhook` |
| Cookie | 生产自动带 `Secure`（已实现） |
| 冒烟 | `npm run smoke:production -- https://你的域名` |

详见 [STRIPE_SETUP.md](./STRIPE_SETUP.md)、[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)。
