# Vercel 生产环境配置清单

在本地已通过 `npm run db:neon` + `npm run dev:stack` 后，按本清单配置 Vercel。  
**逐步上线**见 [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)。

## 快速对照表（复制到 Vercel）

| 变量 | Production | Preview | 说明 |
|------|:----------:|:-------:|------|
| `DATABASE_URL` | ✅ | ✅ | Neon/Supabase 连接串，`?sslmode=require` |
| `AUTH_SECRET` | ✅ | ✅ | `openssl rand -base64 32` |
| `APP_URL` | ✅ | 推荐 | `https://ai-ide-flame.vercel.app` |
| `STRIPE_SECRET_KEY` | 收费时 | test | `sk_live_...` / `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | 收费时 | test | Webhook 签名 |
| `STRIPE_PRICE_PRO` | 收费时 | test | Price ID |
| `STRIPE_PRICE_ENTERPRISE` | 收费时 | 可选 | Price ID |
| `ALLOW_DEV_BILLING` | ❌ 勿设 | 可 `true` | 生产禁止，否则可 dev_mock 升级 |

**不要**在 Production 设置 `VITE_ALLOW_OFFLINE_AUTH`（仅本地演示用）。

---

## 1. 数据库

1. 创建 [Neon](https://neon.tech) 或 [Supabase](https://supabase.com) Postgres。
2. 在 Vercel 填入 **`DATABASE_URL`**。
3. 首次部署后在本机执行（针对**该生产库**，谨慎）：

```bash
DATABASE_URL="postgresql://..." npm run prod:db
```

等价于 `prisma db push` + `db:seed`（订阅计划）。

---

## 2. 认证（必填）

| 变量 | 说明 |
|------|------|
| `AUTH_SECRET` | 与本地不同；`openssl rand -base64 32` |

可选 OAuth / 邮件见 [`.env.example`](../.env.example)。

---

## 3. 应用 URL

| 变量 | 示例 |
|------|------|
| `APP_URL` | `https://ai-ide.vercel.app` |

用于 Stripe 回流、邮件链接等。

---

## 4. Stripe（收费时）

见 [STRIPE_SETUP.md](./STRIPE_SETUP.md)。生产使用 **live** keys，且 **不要** 设置 `ALLOW_DEV_BILLING=true`。

Webhook URL：

```text
https://<your-domain>/api/subscription/webhook
```

---

## 5. 构建与部署

| 项 | 值 |
|----|-----|
| Framework | Vite |
| Build Command | `npm run build:deploy` |
| Output Directory | `dist` |
| API | `api/**/route.ts` → Serverless Functions |

`vercel.json` 已配置 COOP/COEP（WebContainer 需要）。

---

## 6. 部署后自动冒烟

```bash
npm run smoke:production -- https://ai-ide.vercel.app
# 或
APP_URL=https://ai-ide.vercel.app npm run smoke:production
```

检查项：

- `GET /api/health` → `status: ok`, `database: connected`
- `GET /api/auth/session` → 200
- `GET /api/workspaces` → 401（未登录）
- `GET /` → 200

---

## 7. 手工冒烟

1. 注册新邮箱 → 注册后**自动登录**（工具栏显示邮箱）。
2. 工作区 → 保存命名工作区 → 刷新 → 列表带「云端」。
3. AI 面板 → 「今日用量」显示服务器配额。
4. 订阅：生产应 Stripe 或「未配置」提示，**不应**出现 dev_mock 直接升级。
5. 欢迎页底部可打开 `/legal/privacy.html`、`/legal/terms.html`。

---

## 8. 本地校验脚本

```bash
npm run verify:env
npm run verify:env:prod
npm run predeploy:check
npm run check:release          # test:local + 生产 env 清单
```

可选错误上报见 [OBSERVABILITY.md](./OBSERVABILITY.md)。

远程健康检查：

```bash
npm run verify:env -- --url https://ai-ide.vercel.app
```

---

## 9. 检查清单

- [ ] `DATABASE_URL` + `npm run prod:db`
- [ ] `AUTH_SECRET` 已设
- [ ] `APP_URL` 与域名一致
- [ ] CI 全绿（`integration-api`, `e2e-ui`, `e2e-stack`）
- [ ] `npm run smoke:production` 通过
- [ ] Stripe Webhook（若收费）
- [ ] 法务页已审阅（当前为模板）
