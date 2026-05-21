# AI IDE 产品现状分析（v1.0.0-rc.1）

> 文档用途：对**当前仓库内已实现的产品**做全景梳理，作为迭代决策、对外说明与优化规划的共同基线。  
> 最后更新：2026-05（认证/订阅/国内支付骨架、欢迎页与计费 UI 模块化之后）。

官方演示：[https://ai-ide.vercel.app](https://ai-ide.vercel.app)  
仓库版本：`package.json` → `1.0.0-rc.1`

---

## 1. 产品定位与目标用户

### 1.1 一句话定位

**开源、浏览器内的 AI 原生轻量 IDE**：零安装打开即可编码，AI 能力由用户自带 API Key（BYOK）直连厂商；可选账号体系与云端工作区、订阅与用量配额。

### 1.2 目标用户场景

| 场景 | 产品如何承接 | 当前成熟度 |
|------|----------------|------------|
| 快速试玩 / 教学 | 欢迎页 → 模板 → 浏览器内运行 | 高 |
| 个人开发者日常 | Monaco + 终端 + AI 对话 + 本地/云端工作区 | 高（云端需配 DB） |
| 需要账号与同步 | 注册登录 + `UserWorkspace` API | 中（生产需部署 API） |
| 付费升级 Pro/Enterprise | 订阅 UI + checkout + 国内支付/Stripe 骨架 | 中（商户未接时为 dev_mock） |
| 团队协作 | Yjs + WebRTC 实验性房间 | 低～中 |
| 企业统一 AI 计费 | 无平台网关 | 未做 |

### 1.3 与演示站的差异

公网演示站历史上以**纯前端 + BYOK**为主；本仓库已具备完整 **Serverless API + Prisma** 能力，但生产环境是否启用取决于 Vercel 环境变量与数据库配置（见 [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)）。

---

## 2. 技术架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Vite SPA)                                              │
│  AppShell · ideStore · Monaco · WebContainer · Chat/面板         │
│  services/* · hooks/* · components/*                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ /api/* (dev: Vite proxy → :3001)
┌───────────────────────────▼─────────────────────────────────────┐
│  API Routes (api/**/*.ts) — Vercel Serverless 形态               │
│  auth · workspaces · subscription · usage · payment · health       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Prisma
┌───────────────────────────▼─────────────────────────────────────┐
│  PostgreSQL (Neon / Docker 本地)                                 │
│  User · Session · UserWorkspace · Plan · Subscription ·          │
│  PaymentOrder · UsageRecord                                      │
└─────────────────────────────────────────────────────────────────┘

外部依赖（不经由平台托管）：
  用户 API Key → OpenAI / Anthropic / Google / DeepSeek / … 直连
  支付宝/微信/Stripe → 商户配置后由 checkout + webhook 回调
```

### 2.1 前端结构

| 目录 | 职责 |
|------|------|
| `src/app/` | 应用壳：`AppShell`、`AppToolbar`、`EditorLayout`、`PanelHost`、`lazyPanels` |
| `src/store/ideStore.ts` | 全局 UI/文件/用户/计划状态（Zustand） |
| `src/hooks/` | 引导、文件、协作同步、计费回跳、WebContainer 等 |
| `src/services/` | AI、认证、工作区目录、插件沙箱、用量、协作 |
| `src/components/` | 功能面板与弹窗（30+ 组件） |
| `src/components/ui/` | 共享 `ModalShell`、`AlertBanner` |
| `src/styles/` | 分层 CSS：`tokens` → 布局模块 → `ui` / `welcome` / `billing` → `responsive` |

### 2.2 后端与领域库

| 目录 | 职责 |
|------|------|
| `api/` | Vercel：`api/health.ts` + `api/index.ts`（rewrite）+ `lib/api/dispatch.ts` 路由全部 `/api/*` |
| `lib/api/` | Cookie、限流、HTTP 工具、健康检查、工作区服务 |
| `lib/auth/` | OAuth 配置与请求处理、邮件骨架 |
| `lib/billing/` | 计划、Stripe、支付宝/微信、`fulfillOrder`、`billingMode` |

### 2.3 数据模型（Prisma）

| 模型 | 用途 |
|------|------|
| `User` / `Account` / `Session` | 邮箱密码 + OAuth 账号关联 |
| `UserWorkspace` | 云端工作区 JSON（files/settings） |
| `Plan` / `Subscription` | 套餐与订阅周期、Stripe 字段可选 |
| `PaymentOrder` | 国内单次支付订单（alipay \| wechat） |
| `UsageRecord` | AI 请求等用量流水 |

---

## 3. 功能域完成度分析

### 3.1 编辑器与 IDE 核心

| 能力 | 实现要点 | 完成度 | 备注 |
|------|----------|--------|------|
| 多文件编辑 | Monaco + `ideStore.files` | ★★★★★ | |
| 语法高亮 / 主题 | `monacoSetup`、9 主题 | ★★★★★ | |
| 全局搜索替换 | `SearchPanel` + `searchService` | ★★★★☆ | |
| Diff / 格式化 | `DiffViewer`、`formatService` | ★★★★☆ | |
| 命令面板 | `CommandPalette` + 快捷键 | ★★★★☆ | 含返回欢迎页等 |
| 状态栏 / 侧边栏 | `StatusBar`、`FileSidebar` | ★★★★☆ | |

### 3.2 AI 能力（BYOK）

| 能力 | 实现要点 | 完成度 | 备注 |
|------|----------|--------|------|
| 多模型对话 | `aiService`、设置中心配置 Key | ★★★★★ | 9 家厂商在 README 列出 |
| 工作区上下文 | `workspaceContextService` | ★★★★☆ | |
| Agent 多文件 | `aiAgentService`、Chat 面板 | ★★★★☆ | |
| 内联补全 | `inlineCompletionService` + Monaco | ★★★★☆ | 有单元测试 |
| 代码审查 / 测例生成 | `CodeReviewPanel` 等 | ★★★★☆ | |
| **平台侧配额** | `POST /api/usage/ai` + 429 | ★★★★☆ | 需登录 + DB；与 BYOK 并存 |

**架构特点**：AI 推理不经过自有后端，无法在服务端统一计费模型调用，仅能对「登录用户请求次数」做配额。

### 3.3 运行与工具链

| 能力 | 完成度 | 备注 |
|------|--------|------|
| WebContainer 运行 Node | ★★★★☆ | COOP/COEP 部署需注意 |
| 集成终端 | ★★★★☆ | `terminalBridge` |
| HTML 预览 | ★★★★☆ | |
| Git 基础 | ★★★☆☆ | `isomorphic-git`，非完整 Git UI |
| 性能面板 | ★★★☆☆ | 偏展示/实验 |

### 3.4 项目管理与工作区

| 能力 | 完成度 | 备注 |
|------|--------|------|
| 模板新建 | ★★★★★ | `TemplateModal` |
| 本地 IndexedDB 自动保存 | ★★★★★ | |
| 导入 ZIP / 文件夹 / GitHub | ★★★★☆ | |
| 工作区管理器 | ★★★★☆ | 本地 + 云端列表 `workspaceCatalogService` |
| 欢迎页最近项目 | ★★★★★ | 已 CSS 模块化 |

### 3.5 账号与认证

| 能力 | API / 代码 | 完成度 |
|------|------------|--------|
| 邮箱注册/登录 | `/api/auth/register`、`callback/credentials` | ★★★★★ |
| JWT Cookie 会话 | `lib/api/authCookie`、`GET /api/auth/session` | ★★★★★ |
| 登出 | `/api/auth/signout` | ★★★★★ |
| 限流 | 注册/登录/找回密码 | ★★★★☆ |
| OAuth GitHub/Google | `/api/auth/oauth/*`、`oauth/sync` | ★★★★☆ 需 env |
| 找回密码 | `/api/auth/forgot-password` | ★★☆☆☆ 演示级，无真实发信 |
| 离线假账号 | `allowOfflineAuthFallback` | 仅 DEV / 显式 env |

### 3.6 订阅与支付

| 能力 | 完成度 | 说明 |
|------|--------|------|
| 套餐定义 CNY | ★★★★★ | Free / Pro ¥68 / Enterprise ¥198 |
| 订阅查询/取消/恢复 | ★★★★★ | CRUD + 集成测试 |
| Stripe checkout/webhook | ★★★★☆ | 可选，`STRIPE_SETUP.md` |
| 支付宝/微信 checkout | ★★★★☆ | 代码就绪，`CN_PAYMENT_SETUP.md` |
| 订单履约幂等 | ★★★★★ | `fulfillPaymentOrder` |
| 开发 mock 升级 | ★★★★★ | 无商户时 `dev_mock` / `dev_simulate` |
| 前端 `CnPayModal` / `SubscriptionModal` | ★★★★☆ | 已共享 Modal + billing CSS |

**计费能力探测**：`getBillingCapabilities()` → `/api/health` 与 `payment-methods` 一致。

### 3.7 协作与插件

| 能力 | 完成度 | 备注 |
|------|--------|------|
| Yjs + WebRTC 房间 | ★★★☆☆ | `collaborationService`、`useCollaborationSync` |
| 与编辑器文件同步 | ★★★☆☆ | 基础已接，非生产级 OT |
| 插件沙箱 | ★★★☆☆ | 示例 JSON + 单元测试 |
| 插件市场 | ☆☆☆☆☆ → ★★☆☆☆ | 官方目录 M3（`pluginCatalogService`）；第三方与签名见 P4 |

### 3.8 UI/UX 与国际化

| 能力 | 完成度 | 备注 |
|------|--------|------|
| 欢迎页视觉与结构 | ★★★★★ | `welcome.css` |
| 计费弹窗一致性 | ★★★★☆ | `ModalShell` / `billing.css` |
| 全站样式统一 | ★★★☆☆ | `SettingsCenter`、`ChatPanel` 等仍大量内联 style |
| i18n | ★★★☆☆ | `src/i18n`，覆盖不完整 |
| 法务页模板 | ★★★★☆ | `/legal/*.html`，需法务审阅 |

---

## 4. API 与集成面清单

### 4.1 HTTP 路由（`api/`）

| 分组 | 路由 | 方法要点 |
|------|------|----------|
| 健康 | `/api/health` | GET，含 DB + billing 能力 |
| 认证 | `/api/auth/register`、`session`、`signout`、`forgot-password`、`[...all]` | |
| OAuth | `/api/auth/oauth/[...slug]`、`providers`、`sync` | |
| 工作区 | `/api/workspaces`、`/api/workspaces/[id]` | 需登录 |
| 订阅 | `/api/subscription`、`plans`、`checkout`、`cancel`、`resume`、`portal`、`webhook` | |
| 支付 | `/api/subscription/payment-methods` | |
| 国内支付 | `/api/payment/alipay/notify`、`wechat/notify`、`orders/[id]`、`dev/simulate` | |
| 用量 | `/api/usage/ai` | POST 扣减，429 |

### 4.2 关键环境变量（摘要）

见 [`.env.example`](../.env.example) 与 [VERCEL_SETUP.md](./VERCEL_SETUP.md)。

| 变量类 | 代表 | 影响 |
|--------|------|------|
| 数据 | `DATABASE_URL` | 无则 API 降级，无云同步/订阅 |
| 安全 | `AUTH_SECRET` | 会话签名 |
| 应用 | `APP_URL` | OAuth 回调、支付 return_url |
| 国内支付 | `ALIPAY_*`、`WECHAT_*` | 真实收款 |
| Stripe | `STRIPE_*` | 海外/门户 |
| 开发 | `ALLOW_DEV_BILLING` | **禁止**用于 Production |
| 前端 | `VITE_ENABLE_OAUTH`、`VITE_ALLOW_OFFLINE_AUTH` | OAuth 与离线登录 |

---

## 5. 质量与工程化

### 5.1 测试金字塔

| 层级 | 命令 | 覆盖重点 | 当前状态 |
|------|------|----------|----------|
| 单元 | `npm run test:unit` | billing、rateLimit、ideStore、协作等 | 16 文件 / 39 用例，已通过 |
| 类型 | `tsc --noEmit` | 全项目 TS | 已通过 |
| 构建 | `npm test` | prisma generate + tsc + build | 发版前 |
| API 集成 | `npm run test:integration:local` | 注册、工作区、配额、订阅、支付模拟 | 需 Neon + `dev:stack` |
| E2E | `npm run test:e2e` | 6 个 spec（导航、认证、计费骨架等） | UI 大改后需回归 |
| 冒烟 | `npm run test:smoke`、`smoke:production` | 构建产物与生产 URL | |
| 骨架自检 | `npm run check:skeleton` | 路由与 billing 能力 | |

### 5.2 CI（`.github/workflows/ci.yml`）

典型流水线：构建 → 集成 API（Postgres）→ E2E UI / fullstack。本地应与 CI 使用相同 `test:integration:local` 入口。

### 5.3 可观测与运维

| 项 | 状态 |
|----|------|
| `/api/health` | 已实现 |
| 前端 `reportError` | 见 [OBSERVABILITY.md](./OBSERVABILITY.md) |
| `npm run admin:lookup` | 客服查询脚本 |
| Sentry / Analytics | 文档有指引，未强制接入 |

---

## 6. 优势、风险与差距（SWOT 式）

### 6.1 优势

- **单机仓全栈**：前端 IDE + API + Schema 一体，适合 Vercel + Neon 快速上线。
- **BYOK 降低平台成本与合规面**：不托管用户模型密钥。
- **商业化骨架完整**：订阅 + 国内支付 + Stripe 可切换，`billingMode` 统一探测。
- **测试与文档可执行**：`check:skeleton`、集成测试、多份 setup 文档。
- **近期 UI 基建**：design tokens、`ModalShell`、欢迎页/计费样式模块，利于继续收敛视觉债。

### 6.2 劣势 / 技术债

- **样式分裂**：约 20+ 组件仍内联 `style`，`SettingsCenter` / `ChatPanel` 最重。
- **README 与实现时间差**：部分模型名/功能为营销表述，需与代码定期对齐。
- **协作与 Git**：能力弱于 VS Code，不宜过度承诺。
- **E2E 与 UI 变更**：欢迎页 class 化后需全量 Playwright 确认。
- **ROADMAP 历史表述**：曾以 Stripe 为主路径，现已国内支付并行（文档正逐步更新）。

### 6.3 机会

- 国内开发者：**CNY 定价 + 支付宝/微信** 差异化于海外 BYOK IDE。
- 账号 + 云工作区：从「玩具 IDE」升级为可留存产品。
- 插件与协作：开源社区可扩展。

### 6.4 威胁 / 依赖

- **WebContainer / 浏览器策略**：部署头与兼容性。
- **厂商 API 变更**：模型 ID、定价由用户自担。
- **支付合规**：商户资质、回调 URL、生产密钥管理。
- **Serverless 限制**：长连接协作、大文件同步需额外架构。

---

## 7. 产品成熟度结论

| 维度 | 评级 | 说明 |
|------|------|------|
| 纯前端 IDE 体验 | **RC** | 可日常演示与自用 |
| 账号 + 云工作区 | **Beta** | 代码完成，依赖生产 DB/API 配置 |
| 订阅与支付 | **Alpha→Beta** | 骨架与 dev 路径可靠；生产收款待商户 |
| 协作 / 插件生态 | **Alpha** | 实验性质 |
| 整体可上线形态 | **RC（带账号的公测）** | 完成阶段 A+B 后可达；收费需阶段 D |

**结论**：当前仓库是「**功能面宽的 RC 骨架**」，不是「全功能商业成品」。最适合的下一步不是再加大型功能，而是 **打绿集成测试、部署生产、收 UI/测试债、明确收费策略**。

---

## 8. 相关文档索引

| 文档 | 内容 |
|------|------|
| [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md) | 基于本文的拓展与优化规划（执行版） |
| [ROADMAP.md](./ROADMAP.md) | 阶段索引与文档导航 |
| [BILLING_SKELETON.md](./BILLING_SKELETON.md) | 计费骨架验收 |
| [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md) | 支付宝/微信 |
| [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) | Neon → Vercel |
| [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md) | 认证计费手工 QA |
