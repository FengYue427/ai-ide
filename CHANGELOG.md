# Changelog

All notable changes to this project are documented here.  
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### 规划

- **v1.0.4** GA → [V1.0.4_KICKOFF.md](docs/V1.0.4_KICKOFF.md)
- **v1.1 RFC** → [V1.1_RFC_STUB.md](docs/V1.1_RFC_STUB.md)

## [1.0.4-rc.1] — 2026-05-27（体验巩固 RC）

### Added

- MCP 官方推荐预置（≥3）· [MCP_OFFICIAL_CATALOG.md](docs/MCP_OFFICIAL_CATALOG.md)
- Agent 上下文：当前打开文件 + 可选终端最近输出（设置 → Agent）
- 项目规则：设置页说明自动注入 Chat/Agent

### Docs

- [V1.0.4.1_EXECUTION.md](docs/V1.0.4.1_EXECUTION.md) · [V1.0.4.2_EXECUTION.md](docs/V1.0.4.2_EXECUTION.md)

## [1.0.3.5] — 2026-05-27（1.0.3.x 终章 · S5 运维收口）

### 运维

- 执行清单：[V1.0.3.5_EXECUTION.md](docs/V1.0.3.5_EXECUTION.md) · 收口 checklist：[V1.0.3.5_OPS_CLOSURE.md](docs/V1.0.3.5_OPS_CLOSURE.md)
- 欢迎页：非 GA 且无 `-rc` 时显示 **v{version} 稳定版** 徽章

### 1.0.4 前置（代码在 main，版本号仍 1.0.3.5）

- MCP 官方推荐预置（≥3）· [MCP_OFFICIAL_CATALOG.md](docs/MCP_OFFICIAL_CATALOG.md) · [V1.0.4.1_EXECUTION.md](docs/V1.0.4.1_EXECUTION.md)

## [1.0.3.4] — 2026-05-27（S3+S4 合并部署）

### 计费（S3）

- 对账 SOP：[BILLING_RECONCILE_DAILY.md](docs/BILLING_RECONCILE_DAILY.md) · 订阅生命周期：[BILLING_SUBSCRIPTION_LIFECYCLE.md](docs/BILLING_SUBSCRIPTION_LIFECYCLE.md)
- 法务页 `payment*.html` 版本行与套餐（¥19 / ¥49）对齐
- 微信 live **仍不接** — [decisions/WECHAT_PAY_v1.0.3.md](docs/decisions/WECHAT_PAY_v1.0.3.md)
- 执行清单：[V1.0.3.3_EXECUTION.md](docs/V1.0.3.3_EXECUTION.md)（内容并入本 tag）

### 发布收官（S4）

- [publish/](docs/publish/) 矩阵升版指引；live 抽测入档 [RC_LIVE_SPOTCHECK_LAST.md](docs/RC_LIVE_SPOTCHECK_LAST.md)
- **1.0.3.x 四级完结**；[V1.1_RFC_STUB.md](docs/V1.1_RFC_STUB.md)
- 执行清单：[V1.0.3.4_EXECUTION.md](docs/V1.0.3.4_EXECUTION.md)

## [1.0.3.2] — 2026-05-27（1.0.3.x · S1+S2 合并部署）

### 运维（S1 观测）

- `getReleaseVersion()` 从 `package.json` 解析，`/api/health` 与发版版本对齐
- `npm run rc:live-spotcheck` · `npm run ops:verify-p1` 门禁文档
- 执行清单：[V1.0.3.1_EXECUTION.md](docs/V1.0.3.1_EXECUTION.md)（内容并入本 tag）

### 信任（S2 域名）

- 自定义域 + `APP_URL` 全链路说明与验收：[CUSTOM_DOMAIN.md](docs/CUSTOM_DOMAIN.md)
- 执行清单：[V1.0.3.2_EXECUTION.md](docs/V1.0.3.2_EXECUTION.md)

### 工程

- 欢迎页 RC 徽章随 `VITE_APP_VERSION` 显示（如 `1.0.3 RC`）

## [1.0.3-rc.1] — 2026-05-26（v1.0.3 Phase 2 RC）

### 发布

- 版本 **1.0.3-rc.1**；欢迎页 RC 徽章（`1.0.3 RC`）
- `npm run rc:live-spotcheck` — 竞品 live 抽测（Chat / Agent+hunk / Tab / @ / 支付宝）
- 文档：[V1.0.3_RC.md](docs/V1.0.3_RC.md)

### 运维

- Phase 1 封板：`npm run ops:verify-p1` · [V1.0.3_PHASE1_OPS.md](docs/V1.0.3_PHASE1_OPS.md)

## [1.0.3] — TBD（GA 草稿）

> Phase 3 打 tag `v1.0.3` 时启用本节；`VITE_GA_LIVE=true` → 欢迎页「正式版」。

### 发布

- **1.0.2.x 全量能力**稳定叙事：Tab FIM、索引 500/2000、Agent 6 工具 + hunk Diff、tasks.md、Win+Mac 桌面
- 竞品复评 **2.75** 维持；live 抽测 5 项记录入 [RC_LIVE_SPOTCHECK_LAST.md](docs/RC_LIVE_SPOTCHECK_LAST.md)
- 微信 live **不接**（仅支付宝 Path B）— [decisions/WECHAT_PAY_v1.0.3.md](docs/decisions/WECHAT_PAY_v1.0.3.md)
- macOS **unsigned** — [decisions/MACOS_SIGNING_v1.0.3.md](docs/decisions/MACOS_SIGNING_v1.0.3.md)
- GitHub Release **v1.0.3**（Web + Win + Mac）；Sentry release `ai-ide@1.0.3`

### 非目标（留 v1.1）

- LSP / Tab++ / Background Agent / VSIX / 全语言 DAP

## [1.0.2.7] — 2026-05-26（1.0.2 附属 · macOS 收官）

- macOS 桌面 CI（`ci.yml` + `desktop-release.yml` dmg/zip）
- 竞品复评 **2.75**；README/ROADMAP 封板；正式开启 1.0.3 大规划
- 文档：[PHASE_V1.0.2.7_DESKTOP.md](docs/PHASE_V1.0.2.7_DESKTOP.md) · [V1.0.2.7_RELEASE.md](docs/V1.0.2.7_RELEASE.md)

## [1.0.2.6] — 2026-05-26（1.0.2 附属 · 任务清单 + 域名 + Toast）

- `.aide/tasks.md` 设置预览；未完成项注入 Agent
- [CUSTOM_DOMAIN.md](docs/CUSTOM_DOMAIN.md)；欢迎页显示当前访问地址
- Chat 配额用尽 / 请求失败 toast（L16）
- 文档：[PHASE_V1.0.2.6_TASKS_DOMAIN.md](docs/PHASE_V1.0.2.6_TASKS_DOMAIN.md)

## [1.0.2.5] — 2026-05-26（1.0.2 附属 · Agent 工具链）

- **`grep_repo`** 内容搜索；`run_command` 安全策略 + 桌面/Web 说明
- `MAX_TOOL_OUTPUT` 32k 导出；活动行截断标记
- 文档：[PHASE_V1.0.2.5_AGENT_TOOLS.md](docs/PHASE_V1.0.2.5_AGENT_TOOLS.md)

## [1.0.2.4] — 2026-05-26（1.0.2 附属 · 索引第二档）

- 索引上限 **500** / **2000**（浏览器 / 桌面）；总字节约 4MB
- Web Worker 分批索引（≥80 文件）+ Chat 进度 `indexed/total`
- 文档：[PHASE_V1.0.2.4_INDEX.md](docs/PHASE_V1.0.2.4_INDEX.md)

## [1.0.2.3] — 2026-05-26（1.0.2 附属 · Tab FIM）

- DeepSeek FIM API + 多行 chat 回退；设置 → 编辑器 Tab 补全开关与最大行数
- 文档：[PHASE_V1.0.2.3_TAB_FIM.md](docs/PHASE_V1.0.2.3_TAB_FIM.md)

## [1.0.2.2] — 2026-05-26（1.0.2 附属 · 块级 Diff）

> 原称 v1.0.4，已并入 [1.0.2.x](docs/VERSIONING.md) 体系。

### 功能

- Agent `write_file` 预览：逐 **变更块** 接受/拒绝
- 多文件队列；**应用已选块** / **跳过** / **应用全部**

### 技术

- `agentApplyHunks.ts`、`mergeAgentFileContent` / `countDiffHunks`
- 文档：[PHASE_IDE5_DIFF.md](docs/PHASE_IDE5_DIFF.md)

## [1.0.2.1] — 2026-05-26（1.0.2 附属 · 运维与信任）

> 原称 v1.0.3，已并入 [1.0.2.x](docs/VERSIONING.md) 体系。

### 运维

- Cron 双 secret；`billing:verify-cron`；[V1.0.2.1_RELEASE.md](docs/V1.0.2.1_RELEASE.md)
- payment 主体、BROWSER_LIMITATIONS 对齐、网络慢提示

### 待 Vercel

- `VITE_SENTRY_DSN`（release `ai-ide@1.0.2.1`）

## [1.0.2] — 2026-05-26（主版本 · GA）

### 发布

- 生产 smoke **5/5**；支付宝 Path B 复验
- [GO_LIVE_NOW.md](docs/GO_LIVE_NOW.md) 上线清单；`npm run go-live:preflight`
- GitHub Release **v1.0.2**（桌面 portable + setup）

### 修复

- Playwright `webServer` 顶层配置，CI E2E 不再 `ERR_CONNECTION_REFUSED`
- E2E 订阅文案兼容 GA 正式收款说明

### IDE-4b — Desktop (Electron)

- Electron shell: remote production URL + preload native FS / terminal
- `npm run electron:dev` / `electron:pack` (Windows portable)
- Up to 2000 local files; index cap 800 on desktop
- **4b-5**: `electron-updater`, Help → Check for Updates, GitHub Releases CI, crash log

### Planning

- [COMPETITOR_MATRIX_2026-05.md](./docs/COMPETITOR_MATRIX_2026-05.md) — Cursor / Kiro / Windsurf
- [PLAN_IDE5_AND_COMPETITORS.md](./docs/PLAN_IDE5_AND_COMPETITORS.md) — IDE-5 WBS

## [1.0.0] — 2026-05-26 (D3 GA — 正式版可收款)

### 上市

- 生产 **支付宝 Path B**：`billingPath=B`，专业版 ¥19 / 团队版 ¥49
- Vercel Production：`APP_URL`、`ALIPAY_*`、`BILLING_CRON_SECRET`；欢迎页 `VITE_GA_LIVE`
- 文档：[GA_LAUNCH_RUNBOOK.md](docs/GA_LAUNCH_RUNBOOK.md)、[GA_POST_LAUNCH_72H.md](docs/GA_POST_LAUNCH_72H.md)

### 产品（自 1.1.0-rc.2 起累积）

- IDE-4a 工具 Agent + 本机文件夹；W8 订阅生命周期；P4 索引 / Tab 补全
- 付费法务页、退款 SOP、`d3:preflight`

## [1.1.0-rc.2] — 2026-05-26 (deploy bundle: IDE-4a + W8 + P4 + GA docs)

### Added

- P4-1：索引增量同步；P4-4：Tab 幽灵补全（防抖/缓存）
- 付费页 `payment.html`；`d3:preflight` / `check:release:d3`；[BILLING_REFUND_SOP.md](docs/BILLING_REFUND_SOP.md)
- GA：`VITE_GA_LIVE` 欢迎页徽章；竞品 ~2.35；[PLAN_STRATEGY_2026_Q3.md](docs/PLAN_STRATEGY_2026_Q3.md)
- Alipay 对账/探测脚本；`tunnel:api`；197 单元测试全绿

### Changed

- `subscriptionDb` 类型修复；`WorkspacePanel` ref 修复；File System Access 类型声明

## [1.1.0-rc] — 2026-05-25 (IDE-4a RC + W8)

### IDE-4a — 本地盘 + 工具 Agent

- File System Access：工作区管理「打开本机项目」、写回磁盘 `syncToLocalDisk`
- 内置 Agent 工具：`list_files` / `read_file` / `write_file` / `search_repo` / `run_command`
- `agentRunner` 多轮 tool_calls（DeepSeek 等）；Chat Agent 活动时间线
- 设置 → Agent 工具循环（自动应用写入、最大轮数）
- DeepSeek V4：Agent 请求禁用 thinking，避免工具循环 400

### Phase 4 W8 — 订阅生命周期

- 周期结束 + **3 天宽限期** 后自动降为 free（`GET /api/subscription` 懒检查）
- `POST /api/billing/expire-subscriptions` + `npm run billing:expire` 批量到期
- 订阅弹窗：取消续费 / 恢复 / 立即降级（已有 UI 接 API）
- Chat 订阅到期提示条

### Docs

- [docs/RC_ANNOUNCEMENT_IDE4A.md](docs/RC_ANNOUNCEMENT_IDE4A.md)
- [docs/AGENT_REGRESSION_CHECKLIST.md](docs/AGENT_REGRESSION_CHECKLIST.md)
- [docs/BILLING_SUBSCRIPTION_LIFECYCLE.md](docs/BILLING_SUBSCRIPTION_LIFECYCLE.md)
- [docs/PHASE_AFTER_IDE4A.md](docs/PHASE_AFTER_IDE4A.md)

### Phase 3 (started)

- See [docs/PHASE3_KICKOFF.md](docs/PHASE3_KICKOFF.md) — P4-1 indexing continuation next.

## [1.0.0-rc.1] — 2026-05-24 (Phase 2 closure)

### Phase 2 shipped

- Production **smoke 5/5** on `ai-ide-flame.vercel.app`
- Legal pages RC final (zh/en privacy + terms) — [docs/LEGAL_RC_2026-05.md](docs/LEGAL_RC_2026-05.md)
- Vercel `api/index.js` esbuild bundle (fixes `lib/api/dispatch` module not found)
- Welcome cloud health banner; `npm run smoke:report`
- RC announcement template — [docs/RC_ANNOUNCEMENT_2026-05.md](docs/RC_ANNOUNCEMENT_2026-05.md)

### Added (Phase 1 batches)

- **i18n**: ~980 keys (zh-CN / en-US), API success messages, plugin `manifest.i18n`
- **P0'**: Neon HTTP-safe Prisma writes, `p0:gate` (22 integration tests + security baseline)
- **P4-1**: Index caps (200 files), merged `.gitignore`, semantic search toggle in Settings
- API 5xx user toasts; health endpoint `hints` for deploy debugging

---

### Release candidate (公测 / RC) — original notes

**Positioning**: Open-source, browser-first AI IDE with **BYOK** (bring your own API keys).  
Cloud accounts and workspace sync require a correctly configured deployment (`DATABASE_URL`, `AUTH_SECRET`, `APP_URL`).

**Included**

- Monaco editor, WebContainer terminal, workspace context, Agent apply flow
- Multi-provider AI chat, quota UI, subscription path A (beta / no live billing)
- Auth API (email/password), cloud workspaces, plugin sandbox + official catalog
- Collaboration (Beta), Git panel, MCP skeleton, bilingual UI

**Not included / limitations**

- Not a full desktop IDE competitor (no native LSP/debugger for all languages)
- Live billing (Alipay/WeChat/Stripe production) not enabled by default
- Third-party plugin signing (M2) not shipped

**Docs**: [LAUNCH_ASSESSMENT_2026-05.md](docs/LAUNCH_ASSESSMENT_2026-05.md), [I18N_SMOKE_CHECKLIST.md](docs/I18N_SMOKE_CHECKLIST.md)

---

## Earlier development

See git history and [docs/PRODUCT_SUMMARY_2026-05.md](docs/PRODUCT_SUMMARY_2026-05.md) for P0～P3 delivery notes.
