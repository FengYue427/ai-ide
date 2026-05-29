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
BACKGROUND_JOB_WORKER_MODE=dummy   # dummy（默认）| agent（云 Agent，见下）
BACKGROUND_AGENT_API_KEY=sk-...  # agent 模式必填（平台密钥，非浏览器 localStorage）
# BACKGROUND_AGENT_PROVIDER=deepseek
# BACKGROUND_AGENT_MODEL=deepseek-v4-flash
# BACKGROUND_AGENT_MAX_ROUNDS=8
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

### Cron 与 Hobby

| 环境 | 队列推进方式 |
|------|----------------|
| **Vercel Hobby** | `vercel.json` 日 Cron `0 4 * * *` → 每天 UTC 04:00 处理最多 `DEFAULT_JOBS_PER_CRON_TICK`（1）个 queued 任务 |
| **本地 / 预发** | `npm run jobs:process`（可 `--limit` 通过改脚本或调 `processBackgroundJobs({ limit: N })`） |
| **Vercel Pro** | 可将 Cron 改为 `*/5 * * * *`（每 5 分钟），并提高 `limit` |

`/api/jobs/process` 响应（**1.1.2.6+**）含 `workerMode`、`processed`、`durationMs`、`jobIds` 等，便于 Cron 日志与告警。

Vercel Cron 路径：`/api/jobs/process`，当前 `0 4 * * *`（见 `vercel.json`）。

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
- Worker 默认 **dummy**（写入 `.aide/background-jobs/{id}.md`）；**agent** 需配置 `BACKGROUND_AGENT_API_KEY`（使用平台密钥，按用户扣 AI 日配额）
- Agent 模式工具集：`list_files` / `read_file` / `write_file` / `search_repo` / `grep_repo`（无 `run_command`）
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
