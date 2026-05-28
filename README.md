# ⚡ AI IDE

开源 AI 原生轻量 IDE，支持浏览器开箱使用与 Agent 驱动的多文件改造。

**当前版本：v1.1.0.11** · [CHANGELOG](./CHANGELOG.md) · [ROADMAP](./docs/ROADMAP.md)

| 入口 | 链接 |
|--|--|
| 在线体验 | https://ai-ide-flame.vercel.app |
| Releases | https://github.com/FengYue427/ai-ide/releases |
| 最新桌面包 | https://github.com/FengYue427/ai-ide/releases/latest |
| 问题反馈 | https://github.com/FengYue427/ai-ide/issues |

## v1.1 重点能力（截至 v1.1.0.11）

- Plan 系统产品化：多计划管理、步骤勾选执行、映射到 Spec tasks
- Agent 常开：默认 Agent 模式，减少模式切换心智负担
- 执行可靠性：计划/Spec 队列、失败重试与跳过、防重复入队
- 执行可追踪：结构化回填（status/validation/filesTouched）
- 队列可观测：当前执行项、预览、成功/失败统计、最近完成
- 队列报告导出：一键复制会话执行报告到剪贴板

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
- Plan Mode（先计划后执行）
- MCP 工具桥接与后续回合

### 计划与规格（Plan/Spec）
- `.aide/plans` 多计划目录管理
- 计划步骤执行队列（Plan Queue）
- 映射到 `.aide/specs/*/tasks.md`
- Spec 执行队列（Spec Queue）与持久化恢复
- 自动回填执行日志与步骤完成状态

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
- 下一执行阶段：`docs/NEXT_EXECUTION.md`
- 发布运行手册：`docs/RELEASE_RUNBOOK.md`
- 对外发布素材：`docs/publish/README.md`

## License

MIT

