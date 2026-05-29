# v1.1.2.x 补丁（轨道 A）

> GA **v1.1.2** 之后的小版本，第四段 `1.1.2.1` 起。与 **v1.1.3 大更新** 分开。  
> **v1.1.3 规划**：[V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md)

---

## 已完成

| 版本 | 主题 | 状态 |
|------|------|------|
| **1.1.2.1** | 后台任务完成通知、工具栏/Tab 徽章 | ✅ |
| **1.1.2.2** | 一键 **应用到 IDE**（`pendingChanges`） | ✅ |
| **1.1.2.3** | Plan 目录 **后台运行** → `POST /api/jobs` | ✅ |
| **1.1.2.4** | 重试、筛选、Plan 步骤回填/自动勾选 | ✅ |
| **1.1.2.5** | **真 Agent Worker（云）** | ✅ |
| **1.1.2.6** | Worker 可观测 + Cron 文档 | ✅ |
| — | CI：`integration-api` 收尾 + `e2e-stack` fullstack | ✅ |

---

## 建议排期（1.1.2.7～.8）

> **原则**：补齐后台 Agent **真实价值** 与 **运维**，然后 **冻结** 本线，开 v1.1.3。

| 版本 | 主题 | 交付要点 | 优先级 |
|------|------|----------|:------:|
| **1.1.2.7** | Plan **批量**后台 | 计划目录「后台运行全部选中步骤」一次确认 → N 个 job；配额按 N 计；去重 | P2 |
| **1.1.2.8** | 体验抛光 | 通知点击打开后台 Tab；任务详情复制 prompt；失败 job 一键重试（已有可跳过） | P2 |

### 1.1.2.5 技术要点（下一 patch 建议）

- 抽取 **无 DOM** 的 Agent 执行层（`lib/api/` 或 `lib/agent/`，禁 import `window`）
- 输入：`job.prompt` + 云工作区文件快照
- 输出：与 dummy 相同 `result.pendingChanges` 结构
- 超时：沿用 30min + `failStaleRunningBackgroundJobs`
- 测试：`backgroundJobRunner` integration + 1 条 e2e（可选，flag 开）

### 明确不做（留在 v1.1.3+）

- Plan **浏览器队列**整体迁入服务端  
- 自动开 PR / GitHub App  
- 单任务 >30min  
- 本机盘无人值守写盘  

---

## 启用

生产需 `VITE_BACKGROUND_AGENT=true`。见 [BACKGROUND_AGENT_QUICKSTART.md](./BACKGROUND_AGENT_QUICKSTART.md)。

| 变量 | 说明 |
|------|------|
| `VITE_BACKGROUND_AGENT` | 客户端面板/入口 |
| `CRON_SECRET` | Worker 触发 |
| `BACKGROUND_JOB_WORKER_MODE` | `dummy`（默认）或 `agent`（需 `BACKGROUND_AGENT_API_KEY`） |
| `BACKGROUND_AGENT_API_KEY` | 云 Agent 平台密钥（**1.1.2.5+**） |

---

## 发版（轨道 A）

每个 patch：`npm run test:local` → `build:deploy` → commit → push → 按需 `vercel --prod`。

---

## 与 v1.1.3 边界

| 归属 1.1.2.x | 归属 v1.1.3 |
|--------------|-------------|
| 后台 job、Worker、面板、Plan→job | 协作信令 **或** Chat 网关 |
| 云工作区回写 | 不涉及 |

**建议**：完成 **1.1.2.5**（真 Worker）后再 Kickoff v1.1.3，避免「后台 Agent 仍是 dummy」的叙事缺口。
