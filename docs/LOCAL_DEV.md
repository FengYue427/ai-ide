# 本地开发与测试（Vercel 配置前）

在配置生产 Vercel 环境变量之前，用本指南把**代码骨架**和**本地测试**跑通。

## 前置条件

- Node.js 20+
- **Postgres**：推荐 [Neon](https://neon.tech)（无需 Docker）；或可选 Docker 本地库

## 1. 安装与配置

```bash
cd ai-ide
npm install
cp .env.local.example .env.local
```

### 方式 A — Neon（推荐，国内网络友好）

按 [`NEON_SETUP.md`](./NEON_SETUP.md) 复制连接串到 `.env.local`，然后：

```bash
npm run db:neon      # 建表 + seed（含 PaymentOrder）
npm run check:skeleton   # 路由 + 单元测试（无需支付宝/微信）
npm run dev:stack
```

支付/订阅骨架验收：[`BILLING_SKELETON.md`](./BILLING_SKELETON.md)

### 方式 B — Docker 本地 Postgres（可选）

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/ai_ide?schema=public` |
| `AUTH_SECRET` | 任意长随机字符串 |

```bash
npm run db:setup
npm run dev:stack
```

Stripe、OAuth、邮件在本地均为**可选**。

## 2. 无数据库（仅前端）

```bash
npm run dev
```

- 地址：http://localhost:3000  
- 认证走浏览器本地账号；`/api/*` 不可用  
- 适合改 UI、Monaco、样式

## 3. 全栈本地（推荐）

**Neon：**

```bash
npm run db:neon       # 检查连接 + prisma push + seed
npm run dev:stack     # API :3001 + Vite :3000（/api 代理到 3001）
```

**或 Docker：**

```bash
npm run db:setup
npm run dev:stack
```

另开终端：

```bash
npm run test:integration
```

## 4. 测试命令速查

| 命令 | 需要 DB | 说明 |
|------|---------|------|
| `npx tsc --noEmit` | 否 | 类型检查 |
| `npm run test:unit` | 否 | Vitest（配额、store、HTTP 等） |
| `npm run test:smoke` | 否 | 构建产物检查 |
| `npm test` | 否* | prisma generate + tsc + 生产构建 |
| `npm run test:integration:offline` | 是* | 需 `dev:api` 在 3001 运行 |
| `npm run test:integration` | 是 | 完整 API 流程（含配额 429） |
| `npm run test:integration:local` | 是 | 一键：DB + API + 离线/全量集成 |
| `npm run test:e2e` | 否 | Playwright UI 冒烟（`--project=ui`） |
| `npm run test:e2e:stack` | 是 | 全栈 E2E（`dev:stack` + Postgres） |
| `npm run verify:env` | 否 | 检查 `.env.local` 必填变量 |
| `npm run db:neon` | 是 | Neon：`db:check` + push + seed（无 Docker） |
| `npm run prod:db` | 是 | 对 `DATABASE_URL` 执行 push + seed |
| `npm run smoke:production` | 否 | 部署后检查 `APP_URL`（含 `/api/health`） |
| `npm run check:release` | 否 | 发版前：`test:local` + 生产 env 清单 |
| `npm run admin:lookup` | 是 | 按邮箱查用户/订阅/用量（客服） |
| `npm run test:local` | 否 | `tsc` + 单元测试（提交前快速校验） |

\* `npm test` 会执行 `prisma generate`，无需 Postgres 进程。

### 一键本地校验（无 DB）

```bash
npm run test:local
```

### 完整 API 集成（有 DB）

**一键（推荐）** — 自动检查数据库、迁移/seed、启动 API、跑离线+全量集成测试并关闭 API：

```bash
npm run test:integration:local
```

已启动过 `db:setup` 且不想重复 push/seed：

```bash
SKIP_DB_SETUP=1 npm run test:integration:local
```

**手动分步：**

```bash
npm run dev:api &
npm run wait:api
API_BASE=http://127.0.0.1:3001 npm run test:integration:offline
API_BASE=http://127.0.0.1:3001 npm run test:integration
```

## 5. API 限流（本地同样生效）

| 路由 | 默认限制 |
|------|----------|
| `POST /api/auth/register` | 5 次 / 15 分钟 / IP |
| `POST /api/auth/callback/credentials` | 20 次 / 15 分钟 / IP |
| `POST /api/auth/forgot-password` | 5 次 / 小时 / IP |
| `POST /api/usage/ai` | 120 次 / 分钟 / 用户 |

超额返回 **429**，响应头含 `Retry-After`。

## 6. 配额与 AI 行为

- **聊天 / 内联补全 / Agent / 代码审查** 等统一经 `sendMessage` / `sendMessageWithDebounce`，发送前检查日配额。  
- **已登录**：配额以 Postgres `UsageRecord` 为准；`POST /api/usage/ai` 超额返回 **429**。  
- **未登录**：配额存在 `localStorage`（仅前端约束，可被清除绕过）。

## 7. 常见问题

| 现象 | 处理 |
|------|------|
| `integration-api` 连接失败 | 先 `npm run dev:api` 或 `dev:stack` |
| `register` 500 | `npm run db:check`，确认 Docker 与 `DATABASE_URL` |
| `prisma generate` EPERM | 关闭占用 `dev:api` 的终端后重试 |
| Playwright 失败 | `npm run test:e2e:install` |

## 8. 与 CI 对齐

GitHub Actions `integration-api` job 会：启动 Postgres → `db:push` + `db:seed` → `dev:api` → `test:integration`。  
本地通过集成测试后，按 [`VERCEL_SETUP.md`](./VERCEL_SETUP.md) 配置生产环境。阶段总览见 [`ROADMAP.md`](./ROADMAP.md)。
