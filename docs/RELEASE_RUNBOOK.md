# 发布运行手册

适用于 **Vercel 生产** 与 **阿里云备案后生产**。

## 发布前检查

```bash
npm run test:local
npm run verify:env:prod
npm run billing:preflight          # 国内支付宝
npm run cn:preflight --env         # 阿里云迁移前
npm run aliyun:p0 --env          # P0 完整清单（国内域 + 支付回调）
```

## Vercel 发布

```bash
npm run build:deploy
npm run deploy
npm run smoke:production -- https://ai-ide-flame.vercel.app
```

## 阿里云发布

1. 按 [DEPLOY_ALIYUN_CN.md](./DEPLOY_ALIYUN_CN.md) 完成备案与 ECS/RDS。
2. 开发机构建并同步到 `/opt/ai-ide`：

```bash
cp deploy/aliyun/env.production.example .env.production
# 编辑 DATABASE_URL、AUTH_SECRET、APP_URL=https://你的域名

cp .env.production.example .env.production   # 前端 VITE_* 构建变量
npm ci && npm run build:deploy
# rsync dist/、node_modules/、prisma/、scripts/、lib/、package.json 等到服务器
```

3. 服务器：

```bash
npm run db:migrate:deploy
pm2 start deploy/aliyun/ecosystem.config.cjs
sudo nginx -t && sudo systemctl reload nginx
```

4. 验收：

```bash
npm run smoke:production -- https://你的域名
npm run aliyun:p0 --env --url https://你的域名
```

## 支付回调

备案域名确定后：

```bash
APP_URL=https://你的域名 node scripts/payment-notify-urls.mjs
```

将输出的 URL 填入支付宝/微信商户控制台。

## 回滚

| 平台 | 做法 |
|------|------|
| Vercel | Dashboard → Deployments → Promote 上一成功部署 |
| 阿里云 | 保留上一版 `dist/` 与 PM2 进程；`pm2 restart` 旧目录 |

## Cron（阿里云）

使用 `deploy/aliyun/crontab.example` 替代 Vercel Cron：

- 03:00 — `/api/billing/expire-subscriptions`
- 04:00 — `/api/jobs/process`
- 可选 — 每小时 `/api/health` 探测（见 `healthcheck.cron.example`）

详见 [OBSERVABILITY.md](./OBSERVABILITY.md)。
