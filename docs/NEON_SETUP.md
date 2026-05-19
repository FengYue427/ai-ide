# Neon 数据库（不用 Docker）

本地全栈与 Vercel 生产可共用 **Neon** Postgres，无需 Docker Desktop。

## 1. 创建 Neon 项目

1. 打开 https://neon.tech 注册/登录  
2. **New Project** → 选区域（如 `Singapore` / `Tokyo` 离国内较近）  
3. 进入项目 → **Connect** / **Connection details**  
4. 复制 **Connection string**（推荐 **Pooled** 带 `-pooler` 的地址）  
5. 确认串末尾有 **`?sslmode=require`**（没有则手动加上）

示例形态（勿照抄，以控制台为准）：

```text
postgresql://neondb_owner:xxxx@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

## 2. 写入本地 `.env.local`

项目根目录 `ai-ide/.env.local`：

```env
DATABASE_URL="粘贴你的 Neon 连接串"
AUTH_SECRET="本地随机串，至少 32 字符"
```

`AUTH_SECRET` 生成（PowerShell）：

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 3. 建表 + 种子数据（只需一次）

```bash
cd ai-ide
npm run db:neon
```

等价于：检查连接 → `prisma db push` → 写入订阅计划。

## 4. 启动全栈

```bash
npm run dev:stack
```

浏览器：http://localhost:3000 — 注册、云工作区、用量 API 均走 Neon。

## 5. 集成测试（可选）

```bash
npm run test:integration:local
```

已执行过 `db:neon` 时可跳过重复迁移：

```bash
# PowerShell
$env:SKIP_DB_SETUP="1"; npm run test:integration:local
```

## 6. 部署 Vercel

在 Vercel **Environment Variables** 填入**同一套**或**单独生产库**的：

| 变量 | 值 |
|------|-----|
| `DATABASE_URL` | Neon 连接串（Production 建议用 Pooled） |
| `AUTH_SECRET` | **新的**生产随机串（勿与本地相同） |
| `APP_URL` | `https://你的域名.vercel.app` |

部署后若表未建过，在本机对**生产连接串**执行一次：

```bash
DATABASE_URL="生产串" npm run prod:db
```

## 常见问题

| 现象 | 处理 |
|------|------|
| `db:check` 失败 | 连接串是否完整、是否含 `sslmode=require`、Neon 项目是否暂停 |
| 注册 500 | 先 `npm run db:neon` |
| 本地与生产数据混在一起 | Neon 可建两个 project（dev / prod），各用各的 `DATABASE_URL` |

## 相关命令

| 命令 | 说明 |
|------|------|
| `npm run db:neon` | 连 Neon 并 push + seed |
| `npm run db:check` | 仅测连接 |
| `npm run dev:stack` | API + 前端 |
| `npm run verify:env` | 检查 `.env.local` |
