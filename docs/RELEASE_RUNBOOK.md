# 发布与回滚 Runbook

适用于 Vercel + Neon/Postgres 的 AI IDE 生产发布。

## 发布前检查

```bash
npm run test:local
npm run build:deploy
npm run verify:env:prod
# 可选远程健康检查
node scripts/verify-env.mjs --production --url https://<your-domain>
```

确认 Vercel Production **未设置**：`ALLOW_DEV_BILLING`、`VITE_ALLOW_OFFLINE_AUTH`。

## 标准发布（Git → Vercel）

1. 合并到 `main` 并 `git push`
2. 在 Vercel Deployments 等待 **Ready**
3. 冒烟：

```bash
npm run smoke:production -- --url https://<your-domain>
```

4. 浏览器验证：登录、保存工作区、AI 配额提示、插件（生产仅内置）

## 数据库变更

### 新环境 / 首次

```bash
DATABASE_URL="..." npm run prod:db
```

默认 `db push` + seed（与历史流程一致）。

### 推荐：迁移模式（可追踪、可回滚 SQL）

```bash
DATABASE_URL="..." npm run db:migrate:deploy
npm run db:seed
```

或：

```bash
USE_PRISMA_MIGRATIONS=true DATABASE_URL="..." npm run prod:db
```

查看状态：

```bash
DATABASE_URL="..." npm run db:migrate:status
```

本地开发新迁移：

```bash
npm run db:migrate
```

## 回滚

### 应用（Vercel）

1. Vercel → Project → Deployments
2. 选择上一个 **Ready** 部署 → **Promote to Production**
3. 再次执行 `smoke:production`

回滚只恢复**前端 + Serverless 代码**，不自动回滚数据库。

### 数据库

- **migrate deploy 之后**：从 `prisma/migrations/*/migration.sql` 手写反向 SQL，在维护窗口执行；或从 Neon 时间点恢复（PITR）。
- **仅 db push 的环境**：无迁移历史时，优先使用 Neon **分支/备份** 恢复，再 `prod:db`。

生产 schema 变更务必先在 staging 库验证。

## 线上排障

### 1. 按 Request ID 串联日志

- API 响应头：`X-Request-Id`
- Vercel Logs 搜索：`"requestId":"<uuid>"` 或 `api.request` / `auth.login.success`

### 2. 健康检查

```bash
curl -s https://<domain>/api/health | jq .
```

`database` 非 `ok` 时检查 `DATABASE_URL`、Neon 状态、`prod:db` / `db:migrate:deploy`。

### 3. 用户问题

```bash
npm run admin:lookup -- user@example.com
```

### 4. 前端错误

- 配置 `VITE_SENTRY_DSN` + `npm install @sentry/react`（见 `docs/OBSERVABILITY.md`）
- 未配置 Sentry 时：浏览器控制台 + `reportError` / `trackEvent` 开发日志

## 关键业务事件（结构化日志）

| 事件 | 含义 |
|------|------|
| `auth.register.success` | 注册成功 |
| `auth.login.success` | 登录成功 |
| `usage.ai.quota_exceeded` | AI 日配额用尽 |
| `billing.checkout.created` | 创建支付会话 |
| `api.request` | 单次 API 请求完成（含 status、durationMs） |
| `api.unhandled` | 路由外层未捕获异常 |

## 紧急开关

| 场景 | 操作 |
|------|------|
| 支付异常 | Production 移除商户 env，或关闭 checkout 相关路由流量 |
| 注册被刷 | 配置 KV 限流 env；临时提高 `auth:register` 门槛 |
| 全站 500 | Promote 上一部署 + 检查 DB 连通 |
