# ⚡ AI IDE

开源 AI 原生轻量 IDE，支持浏览器开箱使用与 Agent 驱动的多文件改造。

**当前版本：v1.1.2**（后台 Agent MVP）· [CHANGELOG](./CHANGELOG.md) · [ROADMAP](./docs/ROADMAP.md)

| 入口 | 链接 |
|--|--|
| 在线体验 | https://ai-ide-flame.vercel.app |
| Releases | https://github.com/FengYue427/ai-ide/releases |
| 最新桌面包 | https://github.com/FengYue427/ai-ide/releases/latest |
| 问题反馈 | https://github.com/FengYue427/ai-ide/issues |

## v1.1.1 计划系统（GA）

完整流程：**写计划 → 映射 Spec → 队列执行 → 报告留档 → 可恢复**。快速上手：[docs/PLAN_SYSTEM_QUICKSTART.md](./docs/PLAN_SYSTEM_QUICKSTART.md)

- **Plan**：多计划目录、模板创建、步骤执行队列、复制/手动标记完成
- **Spec**：目录管理、映射并执行、Spec 执行队列
- **报告**：保存到 `.aide/reports/`、目录管理、预览后恢复队列、批量清理
- **溯源**：Plan ↔ Spec 来源展示与一键跳转
- **可观测**：任务队列面板、成功/失败统计、长队列预览展开
- **工作区**：`.aide` 一键同步到 AI 索引（缓解编辑器与索引不一致）

Agent 默认常开；队列与 Chat 草稿支持本地持久化。

## v1.1.2 后台 Agent（MVP）

关页后服务端继续执行 Agent 任务。快速上手：[docs/BACKGROUND_AGENT_QUICKSTART.md](./docs/BACKGROUND_AGENT_QUICKSTART.md)

- **提交**：Chat Agent 模式 → **后台运行**（需登录 + `VITE_BACKGROUND_AGENT=true`）
- **查看**：右栏 **后台任务** Tab（轮询、取消、预览 Diff）
- **结果**：写入**云工作区**（默认 `default`）；Free 2 次/日，Pro 更高配额
- **运维**：Cron `/api/jobs/process`；本地 `npm run jobs:process`

生产默认关闭后台 Agent UI；启用见 [V1.1_FEATURE_FLAGS.md](./docs/V1.1_FEATURE_FLAGS.md)。

## 快速开始

```bash
npm install
npm run dev
```

默认前端开发地址：`http://localhost:3000`

## 本地开发模式

| 命令 | 用途 |
|--|--|
| `npm run dev` | 前端热更新（Vite） |
| `npm run dev:api` | 本地 API 服务 |
| `npm run dev:stack` | API + 前端并行启动 |
| `npm run dev:full` | 使用 Vercel CLI 启动全链路 |
| `npm run preview` | 预览生产构建 |

### 带数据库联调（推荐 Neon）

```bash
cp .env.local.example .env.local
npm run db:neon
npm run dev:stack
```

文档参考：`docs/NEON_SETUP.md`、`docs/LOCAL_DEV.md`、`docs/VERCEL_SETUP.md`

## 测试与发布校验

```bash
npm run test:local
npm run test:all
npm run check:release
```

发布与回滚流程：`docs/RELEASE_RUNBOOK.md`

## 功能概览

### AI 与 Agent
- 多模型 BYOK 对话
- Workspace 上下文 + `@` 引用
- Agent 多文件编辑与差异应用
- **后台 Agent**（v1.1.2）：服务端任务 + 云工作区回写（特性开关）
- Plan Mode（先计划后执行）
- MCP 工具桥接与后续回合

### 计划与规格（Plan/Spec）— v1.1.1
- `.aide/plans` 多计划 + 内置/自定义模板
- Plan / Spec 双队列、映射并执行、失败重试与跳过
- `.aide/reports` 执行报告与恢复预览
- Plan ↔ Spec 溯源（`.aide/meta/plan-spec-links.json`）
- 设置中心：计划总览、Plan/Spec/报告目录

### 编辑器与工程能力
- Monaco Editor、全局检索、命令面板
- WebContainer 运行与终端
- 工作区保存/导入/导出
- 协作与基础 Git 面板

## 部署

推荐 Vercel（前端 + `/api`）。常用命令：

```bash
npm run build:deploy
npm run deploy
```

手工静态部署仅覆盖前端能力，不含 serverless API。

## 文档导航

- 版本记录：`CHANGELOG.md`
- 路线图：`docs/ROADMAP.md`
- 计划系统快速上手：`docs/PLAN_SYSTEM_QUICKSTART.md`
- v1.1.1 GA 清单：`docs/V1.1.1_GA_EXECUTION.md`
- v1.1.2 后台 Agent：`docs/BACKGROUND_AGENT_QUICKSTART.md` · `docs/V1.1.2_GA_EXECUTION.md`
- 下一执行阶段：`docs/NEXT_EXECUTION.md`
- 发布运行手册：`docs/RELEASE_RUNBOOK.md`
- 对外发布素材：`docs/publish/README.md`

## License

MIT

