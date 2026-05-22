# ⚡ AI IDE

> 开源 AI 原生轻量 IDE —— 在浏览器里跑完整开发环境

**版本 `v1.0.0-rc.1` · RC 公测** — 见 [CHANGELOG.md](./CHANGELOG.md)

**[🚀 立即体验](https://ai-ide-flame.vercel.app)**

| 模式 | 说明 |
|------|------|
| **BYOK（推荐）** | 自带 API Key，本地/浏览器编辑，无需云数据库 |
| **云账号** | 注册、云工作区同步需部署方配置 `DATABASE_URL` 等 — [VERCEL_ENV_PHASE2.md](docs/VERCEL_ENV_PHASE2.md) |
| **订阅** | 公测期路径 A：**不收款**，专业功能免费开放（见应用内说明） |

> 维护者：部署后请跑 `APP_URL=https://你的域名 npm run smoke:production`（目标 5/5）。  
> 上市评估：[docs/LAUNCH_ASSESSMENT_2026-05.md](docs/LAUNCH_ASSESSMENT_2026-05.md) · 执行清单：[docs/NEXT_EXECUTION.md](docs/NEXT_EXECUTION.md)

## ✨ 核心亮点

- 🤖 **9大AI模型支持** — GPT-5.4、Claude Opus 4.7、Gemini 3.1 Pro、DeepSeek V4、Qwen 3.5、GLM-5、MiniMax M2.5、Grok 4.20、Ollama本地模型
- 📂 **工作区上下文** — 上传整个项目让AI理解完整代码库，跨文件修改
- 💻 **浏览器内运行** — WebContainer 支持在浏览器中运行 Node.js
- 🎨 **VS Code 同款编辑器** — Monaco Editor，语法高亮、智能补全
- 🌙 **9种主题** — 深色、浅色、Monokai、Dracula 等
- 🔄 **实时协作（Beta）** — WebRTC 多人在线编辑
- 📦 **零安装** — 打开浏览器即可使用

## 快速开始

```bash
npm install
cp .env.example .env.local   # 可选：云端认证 / API 联调
npm run dev                  # 仅前端（默认 http://localhost:3000）
```

### 本地开发模式

| 命令 | 用途 | API 路由 |
|------|------|----------|
| `npm run dev` | 前端热更新（Vite） | 不可用；认证走浏览器本地账号 |
| `npm run dev:full` | 前端 + Serverless API（需 [Vercel CLI](https://vercel.com/docs/cli)） | `/api/*` 可用 |
| `npm run preview` | 预览生产构建 | 无 API |

完整后端联调（推荐 **Neon**，无需 Docker / Vercel 登录）：

```bash
# 1. 复制环境变量，把 Neon 连接串写入 .env.local（见 docs/NEON_SETUP.md）
cp .env.local.example .env.local

# 2. 建表 + 种子数据
npm run db:neon

# 3. 同时启动 API(3001) + 前端(3000)，Vite 已代理 /api
npm run dev:stack

# 4. 端到端 API 测试（一键）
npm run test:integration:local
```

可选 Docker 本地库：`npm run db:setup` 代替 `db:neon`。

或手动：`npm run test:integration`（需另开终端 `npm run dev:api`）。

使用 Vercel CLI 的替代方式：`npm run dev:full`（需 `vercel login`）。

环境变量说明见 [`.env.example`](./.env.example)（按 API 路由标注必填 / 可选）。

国内支付见 [`docs/CN_PAYMENT_SETUP.md`](./docs/CN_PAYMENT_SETUP.md)；Stripe 可选见 [`docs/STRIPE_SETUP.md`](./docs/STRIPE_SETUP.md)。  
**产品现状分析**见 [`docs/PRODUCT_ANALYSIS.md`](./docs/PRODUCT_ANALYSIS.md)；**下一步优化规划**见 [`docs/OPTIMIZATION_PLAN.md`](./docs/OPTIMIZATION_PLAN.md)；**与 Cursor/Kiro 差距清单**见 [`docs/IDE_GAP_CHECKLIST.md`](./docs/IDE_GAP_CHECKLIST.md)。  
**浏览器版能力边界**见 [`docs/BROWSER_LIMITATIONS.md`](./docs/BROWSER_LIMITATIONS.md)；**Electron 评估**见 [`docs/ELECTRON_EVAL.md`](./docs/ELECTRON_EVAL.md)。  
阶段索引与文档导航见 [`docs/ROADMAP.md`](./docs/ROADMAP.md)；上线步骤见 [`docs/DEPLOY_CHECKLIST.md`](./docs/DEPLOY_CHECKLIST.md)；**Vercel 域名与 403 说明**见 [`docs/VERCEL_DEPLOYMENT_URLS.md`](./docs/VERCEL_DEPLOYMENT_URLS.md)；环境变量见 [`docs/VERCEL_SETUP.md`](./docs/VERCEL_SETUP.md)。

### 校验（提交前推荐）

```bash
npm run test:local    # 快速：tsc + 单元测试（无需数据库）
npm run rc:preflight      # RC：test:local + API 骨架（有 .env.local 时顺带验 env）
npm run s0:gate           # S0：test:local + 骨架 + verify-env --production（路径 A，不要求商户）
npm run check:release     # 同 verify 习惯；需 .env.local 含 DATABASE_URL / AUTH_SECRET / APP_URL
npm run check:release:billing  # 路径 B：再加 --require-cn-billing
npm run deploy:check  # 可选 APP_URL=… 远程 health 冒烟
npm run test:all      # 构建 + 单元测试 + 冒烟测试
npm test              # prisma generate + tsc + 生产构建
npm run test:e2e:install && npm run test:e2e  # Playwright UI（需安装浏览器）
```

Neon 配置见 [`docs/NEON_SETUP.md`](./docs/NEON_SETUP.md)。本地全栈与集成测试见 [`docs/LOCAL_DEV.md`](./docs/LOCAL_DEV.md)。

CI 在 `main` 上会跑：`build` → `integration-api`（Postgres + API 集成）→ `e2e-ui` / `e2e-stack`（全栈需数据库）。

云同步 API（Phase S3）需配置 `DATABASE_URL` 后使用 `npm run dev:full` 联调。

## 功能特性

### 🤖 AI 功能
- 多模型对话（9大主流AI模型，BYOK）
- 工作区上下文（全量文件清单 + 摘要 + 选中文件全文）
- 可选语义检索（BYOK embedding，注入 Chat）
- 项目规则 `.aide/rules.md` / `.cursorrules` 自动注入
- Agent 多文件编辑 + 变更预览（支持按块应用）
- MCP 工具骨架（设置中心配置，`/api/mcp/proxy`）
- 内联补全、代码审查、单元测试生成

### 💻 编辑器
- Monaco Editor（VS Code 同款）
- 多文件 / 工作区、`@` 符号索引与命令面板跳转
- 全局搜索替换（工作区范围 + 替换预览）
- TS/JS 跨文件 IntelliSense、侧栏大纲、F12 导航
- Diff 对比与 Agent 块级应用
- 9 种主题、快捷键与命令面板（含 `npm run` scripts）

### 🚀 运行环境
- WebContainer 浏览器内 Node.js
- 终端命令历史
- HTML 实时预览
- 性能分析面板

### 📂 项目管理
- 项目模板（React/Vue/Node/Vanilla）
- 文件拖拽上传
- ZIP 项目导出
- IndexedDB 自动保存
- 工作区管理（保存/导入/导出）
- GitHub 仓库导入
- 代码分享（生成链接）

### 🤝 协作
- WebRTC 实时协作编辑
- Git 面板（分支、放弃改动、diff、切换分支同步编辑器）

### 🎨 UI/UX
- Glassmorphism 毛玻璃风格
- 命令面板（Ctrl+Shift+P）
- 底部状态栏
- 欢迎引导页面
- i18n 国际化（中/英）— 状态见 [docs/I18N_STATUS.md](docs/I18N_STATUS.md)，英文验收见 [docs/I18N_SMOKE_CHECKLIST.md](docs/I18N_SMOKE_CHECKLIST.md)
- 代码片段库
- 插件系统架构

## 使用说明

1. **配置 AI**: 点击顶部「AI」按钮，选择模型并输入 API Key
2. **工作区**: 点击「工作区」按钮上传项目文件，让AI理解完整上下文
3. **运行代码**: 编写代码后点击「运行」按钮，在底部终端查看输出
4. **AI 对话**: 在右侧面板输入问题，AI 会根据当前代码或工作区上下文回答
5. **自动保存**: 项目会自动保存到浏览器本地存储
6. **导出项目**: 点击「导出」按钮下载文件，或「导出ZIP」打包整个项目

## 支持的 AI 模型

| 提供商 | 模型 | 说明 |
|--------|------|------|
| OpenAI | GPT-5.4 / GPT-5 / GPT-4o | 2026年3月旗舰模型 |
| Anthropic | Claude Opus 4.7 / Sonnet 4.6 | 编程能力领先 |
| Google | Gemini 3.1 Pro / 3 Flash | 性价比极高 |
| DeepSeek | V4 Pro / V4 Flash | 2026年4月发布 |
| 阿里通义 | Qwen 3.5 Max / Plus | 开源生态丰富 |
| 智谱AI | GLM-5 / GLM-5.1 | 华为昇腾训练 |
| MiniMax | M2.5 / M2.5 Lightning | SWE-bench高分 |
| xAI | Grok 4.20 | 推理能力强 |
| Ollama | Llama 4 / Qwen / 本地模型 | 无需API Key |

## 部署

**官方生产环境：[Vercel](https://ai-ide-flame.vercel.app)**（前端 + `/api` Serverless + COOP/COEP 头）

| 平台 | 支持 | 说明 |
|------|------|------|
| **Vercel** | 推荐 | 一键导入仓库；构建命令 `npm run build:deploy` |
| GitHub Pages | 不推荐 | 无 Serverless API，与当前架构不符 |
| 纯静态托管 | 仅 IDE 前端 | `npm run build:deploy` 后上传 `dist/`；认证 / 云同步不可用 |

### Vercel 部署

```bash
npm install
cp .env.example .env.local   # 本地联调；生产环境在 Vercel 控制台配置
npm run deploy               # 或 vercel --prod
```

或在 [vercel.com](https://vercel.com) 导入本仓库。生产构建与本地一致：

```bash
npm run build:deploy   # tsc + vite build + 复制 website/ 到 dist/website/
```

`website/` 为营销落地页，构建后位于 `dist/website/`（旧 Netlify 站点仅作静态页参考，见 `website/netlify.toml`）。

### 手动静态部署（无 API）

```bash
npm run build:deploy
# 将 dist/ 目录上传到任意静态 CDN（功能限于纯前端 + 本地存储）
```

## 技术栈

- **框架**: React 18 + TypeScript
- **构建**: Vite 5
- **编辑器**: Monaco Editor
- **运行环境**: WebContainer API
- **状态管理**: Zustand（`ideStore`）+ React Hooks
- **存储**: IndexedDB
- **协作**: Yjs + WebRTC

## License

MIT

