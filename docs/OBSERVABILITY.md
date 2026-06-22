# 可观测性与告警

## 健康检查

**端点：** `GET /api/health`

返回 `status`、`version`、`database`（connected / unavailable）、`billing`、`platformAi` 等。

```bash
curl -s https://你的域名/api/health | jq .
npm run smoke:production -- https://你的域名
npm run smoke:report -- https://你的域名
```

### 阿里云定时探测

复制 `deploy/aliyun/healthcheck.cron.example` 到 crontab，失败时写入 `/var/log/ai-ide-health.log`。可配合阿里云云监控 **站点可用性** 告警。

## 支付与订阅 Cron

| 任务 | 路径 | Vercel | 阿里云 |
|------|------|--------|--------|
| 订阅过期 | `POST /api/billing/expire-subscriptions` | vercel.json 03:00 | crontab 03:00 |
| 后台 Job | `POST /api/jobs/process` | vercel.json 04:00 | crontab 04:00 |

Header：`Authorization: Bearer $CRON_SECRET`（或 `BILLING_CRON_SECRET`，与 `.env` 一致）。

本地验证：

```bash
npm run billing:verify-cron
npm run jobs:verify-cron
npm run billing:reconcile    # 支付宝对账（需订单号）
```

## Sentry（推荐 GA 前配置）

1. 创建 Sentry 项目，复制 DSN。
2. **构建时** 设置 `VITE_SENTRY_DSN`（写入 `.env.production` 或 Vercel/构建机环境）。
3. 可选安装：`npm install @sentry/react`（已在 `sentryInit.ts` 按需加载）。
4. Release 名格式：`ai-ide@<package.json version>`。

`npm run verify:env:prod` 与 `ops:verify-p1` 会提示 DSN 是否缺失。

## PM2 日志（阿里云）

```bash
pm2 logs ai-ide-api
pm2 monit
```

Nginx 访问/错误日志：`/var/log/nginx/`。

## 运维脚本

```bash
npm run governance:report
npm run ops:verify-p1
npm run go-live:preflight
```

## 降级信号

`/api/health` 返回 `degraded` 时查看 `hints` 数组：

- `database=not_configured` — 检查 `DATABASE_URL`
- `database=unavailable` — RDS 白名单、连接串、迁移是否执行

阿里云 RDS 故障排查见 [ENV_PRODUCTION.md](./ENV_PRODUCTION.md)。
