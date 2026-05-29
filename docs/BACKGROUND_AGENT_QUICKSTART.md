# 后台 Agent 快速上手（v1.1.2）

> **版本**：v1.1.2 · **开关**：`VITE_BACKGROUND_AGENT=true`  
> **DoD**：[V1.1.2_GA_EXECUTION.md](./V1.1.2_GA_EXECUTION.md) · **主规划**：[V1.1.2_MASTER_PLAN.md](./V1.1.2_MASTER_PLAN.md)

---

## 1. 一句话

**在 Chat 提交 Agent 任务 → 关页 → 服务端继续跑 → 回来在「后台任务」面板看结果，云工作区可见文件变更。**

与 **Chat 任务队列**（Plan/Spec 浏览器 内队列）不同：后台任务由 **服务端 Worker** 执行。

---

## 2. 开启（开发 / 预发）

`.env.local`：

```env
VITE_BACKGROUND_AGENT=true
DATABASE_URL=...
CRON_SECRET=...          # Vercel Cron / 本地 npm run jobs:process
BACKGROUND_JOB_WORKER_MODE=dummy   # 默认 dummy；F4+ 云 Agent 为 agent
```

迁移：

```bash
npx prisma migrate deploy
```

---

## 3. 用户路径

1. **登录**（云工作区同步需要账号）
2. 打开 **AI 助手** → **Agent 模式**
3. 输入改仓 prompt → 点输入框旁 **Server 图标**（后台运行）
4. 切到右栏 **后台任务** Tab → 状态 `queued` → `running` → `succeeded`
5. **预览 Diff** 或从工作区管理器加载云工作区 `default`

---

## 4. 运维 / 本地处理队列

| 命令 | 说明 |
|------|------|
| `npm run jobs:process` | 本地处理 queued 任务（同 Cron 逻辑） |
| `npm run jobs:verify-cron` | 校验 `/api/jobs/process` Bearer 鉴权 |

Vercel Cron：`/api/jobs/process`，`*/5 * * * *`（见 `vercel.json`）。

---

## 5. 配额（F4）

| 计划 | 每日创建 | 同时进行 |
|------|----------|----------|
| Free | 2 | 1 |
| Pro / Enterprise | 100 | 5 |

超限：`POST /api/jobs` → **429**，客户端提示升级专业版。

---

## 6. 已知限制（GA）

- **浏览器本机盘**无法无人值守写盘 → 结果写入 **云工作区**（`repoKey`，默认 `default`）
- 单任务硬超时 **≤30min**
- Worker 默认 **dummy**（写入 `.aide/background-jobs/{id}.md`）；真 Agent 云执行在后续版本加强
- **不做**：Plan 多步队列后台化、PR 自动创建

---

## 7. API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/jobs` | 创建（`queued`） |
| GET | `/api/jobs` | 列表 |
| GET | `/api/jobs/:id` | 详情 |
| POST | `/api/jobs/:id/cancel` | 取消 |
| GET/POST | `/api/jobs/process` | Cron Worker（Bearer） |
