# 上线清单（Neon 已就绪 → Vercel）

适合：本地已跑通 `npm run db:neon` + `npm run dev:stack`，准备发布到公网。

---

## 阶段 S0 — 生产可信（必须先完成）

与 [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md) 轨道 P0 对齐；**未完成前不对外宣称「全栈已上线」**。

| 步骤 | 命令 / 动作 | 通过标准 |
|------|-------------|----------|
| S0-1 本地门禁 | `npm run p0:gate` 或 `npm run s0:gate` | 单测 + **集成测试全绿** + `security-baseline`（路径 A 不要求商户） |
| S0-2 部署拓扑 | 仓库已含 `api/health.ts`、`api/index.ts`、`vercel.json` rewrite | 勿再拆成 20+ 个 `api/**/route.ts`（Hobby 12 函数上限） |
| S0-3 部署后冒烟 | `APP_URL=https://你的域名 npm run deploy:check` | `smoke:production` 5/5；`/api/health` 为 JSON 且 `database: connected` |
| S0-3b 离线登录策略 | 生产构建禁止 `VITE_ALLOW_OFFLINE_AUTH` | 仅 `npm run dev` 可本地假账号；见 `authService.allowOfflineAuthFallback()` |
| S0-4 路径 B 收款前 | `node scripts/verify-env.mjs --production --require-cn-billing` | 已配置支付宝或微信商户相关变量 |
| S0-5 安全基线 | Vercel Production 环境变量人工核对 | 无 `ALLOW_DEV_BILLING`；构建无 `VITE_ALLOW_OFFLINE_AUTH`（`verify-env --production` 会失败） |

**路径说明**：默认 `verify-env --production` 为 **路径 A（公测、不接国内商户）**；接支付宝/微信上线前再加 `--require-cn-billing`。

---

## 第 1 步：生成生产密钥（本机 PowerShell）

```powershell
# AUTH_SECRET（生产专用，勿与本地 .env.local 相同）
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

复制输出，稍后放入 Vercel。

---

## 第 2 步：Vercel 环境变量

Vercel → 你的项目 → **Settings → Environment Variables**

| 变量 | 值 | 环境 |
|------|-----|------|
| `DATABASE_URL` | Neon **Pooled** 连接串（与本地可相同或另建生产库） | Production + Preview |
| `AUTH_SECRET` | 上一步生成的随机串 | Production + Preview |
| `APP_URL` | `https://ai-ide-flame.vercel.app`（你的生产域名） | Production |

**不要**在 Production 设置：`ALLOW_DEV_BILLING`、`VITE_ALLOW_OFFLINE_AUTH`。

国内收款（路径 B）上线前：在本地或 CI 用 `node scripts/verify-env.mjs --production --require-cn-billing` 校验商户变量；详见 [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md)。

可选 OAuth：`VITE_ENABLE_OAUTH=true` + 服务端 `AUTH_GITHUB_*` / `AUTH_GOOGLE_*`（见 `.env.example`）。

---

## 第 3 步：生产库建表（仅首次）

若该 Neon 库**从未**跑过 `db:neon` / `prod:db`：

```powershell
cd C:\Users\18663\IDE\ai-ide
$env:DATABASE_URL="你的 Neon 连接串"
npm run prod:db
```

若本地已对**同一库**执行过 `npm run db:neon`，可跳过。

---

## 第 4 步：部署

**方式 A — Git 自动部署（推荐）**

1. 代码 push 到 GitHub 已连接的仓库  
2. Vercel 自动构建（Build Command: `npm run build:deploy`）  
3. 在 Deployments 查看是否成功  

**方式 B — CLI**

```powershell
cd C:\Users\18663\IDE\ai-ide
npm run rc:preflight          # 本地：单测 + API 路由骨架
npm run check:release         # 生产 env 变量检查（部署前）
npm i -g vercel
vercel login
vercel --prod
```

---

## 第 5 步：部署后冒烟

```powershell
$env:APP_URL="https://ai-ide-flame.vercel.app"
npm run deploy:check
npm run smoke:production -- $env:APP_URL
```

**Vercel 面板预览 403？** 见 [VERCEL_DEPLOYMENT_URLS.md](./VERCEL_DEPLOYMENT_URLS.md)（部署保护 vs 生产域名）。

期望全部 ✅，且 `health` 显示 `db=connected`。

远程 env 检查：

```powershell
npm run verify:env -- --url https://你的项目.vercel.app
```

---

## 第 6 步：浏览器手工验收（5 分钟）

1. 打开生产 URL → 注册新邮箱 → 自动登录  
2. **工作区管理** → 保存 → 刷新 → 显示「云端」  
3. AI 面板 → 有「今日用量」  
4. `Ctrl+Shift+P` →「返回欢迎页」→ 欢迎屏出现  
5. 底部法律链接可打开  

---

## 第 7 步：确认 CI（可选）

GitHub → Actions → 最新 `main` 应绿：

- `build`
- `integration-api`
- `e2e-ui`
- `e2e-stack`

本机 E2E 需先：`npm run test:e2e:install`

---

## 常见问题

| 现象 | 处理 |
|------|------|
| `/api/health` 503 | Vercel 未设 `DATABASE_URL` 或未 Redeploy |
| `/api/health` 500 / FUNCTION_INVOCATION_FAILED | 查 Functions 日志；确认 Prisma 使用 Neon adapter、Neon Pooled URL |
| `/api/auth/session` 404 | 确认 `vercel.json` 含 `/api/(.*)` → `/api?__p=$1` 且已部署最新 `main` |
| 注册 500 | 对生产库执行 `npm run prod:db` |
| 登录后刷新掉线 | 检查 `AUTH_SECRET` 是否部署后改过 |
| 仅前端无 API | 确认访问的是 Vercel 域名而非纯 `vite preview` |

---

## 相关文档

- [VERCEL_SETUP.md](./VERCEL_SETUP.md) — 变量说明  
- [NEON_SETUP.md](./NEON_SETUP.md) — 数据库  
- [STRIPE_SETUP.md](./STRIPE_SETUP.md) — 收费（可选）
