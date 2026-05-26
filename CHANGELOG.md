# Changelog

All notable changes to this project are documented here.  
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### 规划（未开发）

- 版本路线图：[ROADMAP_V1.0.3-V1.0.9.md](docs/ROADMAP_V1.0.3-V1.0.9.md)
- 状态总览：[V1.0.2_STATUS_SUMMARY.md](docs/V1.0.2_STATUS_SUMMARY.md)
- 竞品对比：[COMPETITOR_COMPARISON_V1.0.2.md](docs/COMPETITOR_COMPARISON_V1.0.2.md)

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
