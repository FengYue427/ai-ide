# Phase 2 — Vercel 环境变量核对（P2-1 / P2-4）

> 生产冒烟 `database=unavailable` 时按本清单排查。法务定稿见 Phase 2 末项（P2-6）。

## 必填（D2 云账号）

| 变量 | 要求 | 常见错误 |
|------|------|----------|
| `DATABASE_URL` | Neon **pooler** 连接串，`?sslmode=require` | 用了直连 host、缺 SSL、项目已暂停 |
| `AUTH_SECRET` | ≥32 字符随机串，`openssl rand -base64 32` | 与本地 `.env.local` 混用导致 cookie 无效 |
| `APP_URL` | 部署根 URL，无尾斜杠，如 `https://ai-ide-flame.vercel.app` | 与浏览器访问域不一致 → OAuth/Cookie 异常 |

## 推荐（前端构建时）

| 变量 | 说明 |
|------|------|
| `VITE_ENABLE_OAUTH` | `true` 且配置 `AUTH_GITHUB_*` / `AUTH_GOOGLE_*` 才显示 OAuth |
| `VITE_ENABLE_PASSWORD_RESET` | 默认不设；配置 `AUTH_EMAIL_SERVER` 后设为 `true` 才显示「忘记密码」 |
| `VITE_SENTRY_DSN` | 可选前端错误上报 |

## 生产禁止（P0'）

| 变量 | 生产值 |
|------|--------|
| `ALLOW_DEV_BILLING` | 未设置或 `false` |
| `VITE_ALLOW_OFFLINE_AUTH` | 未设置或 `false` |

## 冒烟诊断（health 响应里的 `checks`）

部署后打开 `/api/health`，除 `database: connected` 外还应看到：

| 字段 | 期望 |
|------|------|
| `checks.authSecretConfigured` | `true` |
| `checks.prismaRouter` | `connected` |

若 `authSecretConfigured: false` → Vercel 未读到 `AUTH_SECRET`（键名必须是下划线 `AUTH_SECRET`）。  
若 `prismaRouter: unavailable` → Prisma 引擎未打进包；`vercel.json` 的 `includeFiles` 必须是**单个字符串**（如 `node_modules/.prisma/**`），不能是数组。  
若 Vercel 日志 **`Cannot find module '/var/task/lib/api/dispatch'`** → 未跑 `npm run build:api`（`build:deploy` 会自动执行），或 Production 仍是旧提交。

## 验收命令

```powershell
cd c:\Users\18663\IDE\ai-ide
$env:APP_URL='https://你的域名.vercel.app'
npm run smoke:production
npm run deploy:check
```

**通过标准**：`health` → `ok`，`database=connected`，冒烟 **5/5**。

## 发版后数据库

```bash
npx prisma migrate deploy
```

在 Neon SQL 或 CI 中确认 schema 与 `prisma/schema.prisma` 一致（P2-3）。

## 记录模板（DEPLOY_CHECKLIST）

```
日期：
APP_URL：
smoke:production：  /5
health.database：   connected | unavailable
AUTH_SECRET 已轮换：是/否
migrate deploy：    是/否
人工 30min QA：     是/否 — 见 AUTH_BILLING_QA.md
```
