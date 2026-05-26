# Changelog

All notable changes to this project are documented here.  
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### 规划

- 下一版 **v1.0.5** Tab FIM：[ROADMAP_V1.0.3-V1.0.9.md](docs/ROADMAP_V1.0.3-V1.0.9.md)

## [1.0.4] — 2026-05-26（块级 Diff MVP）

### 功能

- Agent `write_file` 预览：逐 **变更块** 接受/拒绝（`AgentApplyModal` + `DiffViewer`）
- 多文件队列：每文件独立块选择；**应用已选块** / **应用整文件** / **跳过本文件** / **应用全部**
- Agent 活动线：`write_file` 待预览时显示变更块数量
- 文档：[PHASE_IDE5_DIFF.md](docs/PHASE_IDE5_DIFF.md)

### 技术

- `agentApplyHunks.ts`、`mergeAgentFileContent` / `countDiffHunks`
- `autoApplyWrites: false`（默认）仍走 Diff 预览

## [1.0.3] — 2026-05-26（运维与信任）

### 运维

- Cron `expire-subscriptions`：支持 `CRON_SECRET` 与 `BILLING_CRON_SECRET` 双 Bearer（修复 Vercel 401）
- `npm run billing:verify-cron` 验收脚本
- [V1.0.3_RELEASE.md](docs/V1.0.3_RELEASE.md)、[WEEKLY_OPS_TEMPLATE.md](docs/WEEKLY_OPS_TEMPLATE.md)、[OPERATOR_LEGAL.md](docs/OPERATOR_LEGAL.md)

### 文档与合规

- `BROWSER_LIMITATIONS.md` 与 `indexLimits` / 桌面 2000 对齐
- `payment.html` / `payment-en.html` 运营主体与 GA 收款说明

### 产品

- 欢迎页 / 设置：国内网络慢或 API 超时提示（`welcome.networkTips`）
- `useCloudHealth` 慢请求（≥6s）触发网络提示

### 待你在 Vercel 完成

- 配置 `VITE_SENTRY_DSN` 后验收 Sentry 测试事件（见 [OBSERVABILITY.md](docs/OBSERVABILITY.md)）

## [1.0.2] — 2026-05-26（上线包 · CI + 发布文档）

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
