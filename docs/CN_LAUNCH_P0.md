# 国内上线 P0 清单（可执行）

迁阿里云 **按顺序执行**；代码侧工具已就绪。

## 0. 本地准备（5 分钟）

```bash
cp .env.aliyun.example .env.aliyun
cp deploy/aliyun/env.production.example .env.production
cp .env.production.example .env.production   # 若尚未存在（VITE 构建变量可合并进同一文件）
```

编辑 `.env.aliyun`：

- `ALIYUN_SSH=ubuntu@你的ECS公网IP`
- `APP_URL=https://你的备案域名`（备案前可暂留，跳过 smoke）
- `SOURCE_DATABASE_URL` = 当前 Neon 连接串
- `TARGET_DATABASE_URL` = 阿里云 RDS 连接串

编辑 `.env.production`：`DATABASE_URL`（RDS）、`AUTH_SECRET`、`APP_URL`、支付宝密钥等。

```bash
npm run test:local
npm run aliyun:p0 --env
```

## 1. 阿里云控制台（人工）

- [ ] 实名认证 · 域名 · 内地 ECS/轻量 · RDS PostgreSQL · 备案服务号
- [ ] [beian.aliyun.com](https://beian.aliyun.com/) 提交备案（见 [DEPLOY_ALIYUN_CN.md](./DEPLOY_ALIYUN_CN.md)）

## 2. 首次 ECS 初始化（SSH 登录服务器一次）

```bash
# 在 ECS 上
curl -fsSL https://raw.githubusercontent.com/FengYue427/ai-ide/main/deploy/aliyun/bootstrap-server.sh | bash
# 或上传仓库后: sudo bash deploy/aliyun/bootstrap-server.sh
```

开发机配置 SSH 免密：`ssh-copy-id ubuntu@ECS_IP`

## 3. 数据库 Neon → RDS

RDS 创建空库 `ai_ide` 后，在 **开发机** 执行：

```bash
npm run db:migrate:neon-to-rds -- --dry-run   # 预览命令
npm run db:migrate:neon-to-rds                 # 需本机 pg_dump/pg_restore
```

无历史数据时可跳过 dump，仅在 RDS 上：

```bash
# DATABASE_URL 指向 RDS
npm run db:migrate:deploy
npm run db:seed    # 首次：写入套餐 Plan
```

## 4. 构建 · 同步 · 启动（开发机一键）

```bash
npm run aliyun:build
npm run aliyun:deploy -- --with-env --skip-smoke   # 备案前跳过 smoke
```

分步等价：

```bash
npm run aliyun:build
npm run aliyun:sync -- --with-env
npm run aliyun:remote-install
```

## 5. Nginx + SSL（备案通过后）

```bash
# 开发机 — 生成 nginx.generated.conf
npm run aliyun:nginx -- --write deploy/aliyun/nginx.generated.conf

# ECS
sudo cp /opt/ai-ide/deploy/aliyun/nginx.generated.conf /etc/nginx/conf.d/ai-ide.conf
sudo nginx -t && sudo systemctl reload nginx
```

DNS A 记录 → ECS · 阿里云免费 SSL · 更新 `APP_URL` 为 `https://域名`

## 6. 支付回调

```bash
APP_URL=https://你的域名 node scripts/payment-notify-urls.mjs
```

支付宝开放平台填入 `/api/payment/alipay/notify`。

## 7. Cron + 监控

```bash
# ECS: crontab -e，粘贴 deploy/aliyun/crontab.example + healthcheck.cron.example
```

```bash
npm run aliyun:deploy -- --with-env          # 含 smoke + aliyun:p0
npm run smoke:production -- https://你的域名
```

可选：`VITE_SENTRY_DSN` → 重建 `npm run aliyun:build`

## 8. 桌面客户端

`.env.electron` 设置 `VITE_API_BASE_URL=https://你的域名` 后：

```bash
npm run electron:pack:offline
```

## 验收标准

- [ ] `/api/health` → `status: ok`，`database: connected`
- [ ] `/api/shares` 未登录 → 401（路由存在）
- [ ] 登录后可分享，`?share=<slug>` 可恢复
- [ ] 订阅 ¥39 / ¥79 · 支付宝可下单
- [ ] 网站底部 ICP 备案号

## 常用命令

| 命令 | 作用 |
|------|------|
| `npm run cn:preflight --env` | 备案采购清单 |
| `npm run aliyun:p0 --env` | P0 文档/Flag 检查 |
| `npm run db:migrate:neon-to-rds` | Neon → RDS |
| `npm run aliyun:build` | 本地构建 dist |
| `npm run aliyun:deploy -- --with-env` | 构建+同步+安装+smoke |
| `npm run aliyun:deploy -- --skip-smoke` | 内测快速部署（备案前） |
| `npm run aliyun:nginx` | 渲染 Nginx 配置 |

## 体验与总规划

- [AIDE_MASTER_PLAN.md](./AIDE_MASTER_PLAN.md) — 宗旨 · Phase 5–8 · 多功能联动
- [AIDE_EXPERIENCE_ROADMAP.md](./AIDE_EXPERIENCE_ROADMAP.md) — 体验 Phase 1–4

海外仍用 Vercel：`npm run deploy` → https://ai-ide-flame.vercel.app
