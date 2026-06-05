# Changelog

All notable changes to this project are documented here.  
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

---

## [1.3.4] — 2026-06-05 · 索引 2.0 可观测

### Added

- **v1.3.4 N1**：`embeddingPersistMetrics` · 设置页 v1.3 卡展示 hit/miss/expired
- **v1.3.4 N2**：v1.3 卡展示 `indexBuildTelemetry` lastMode / ms
- **v1.3.4 N3**：语义检索与索引状态联动提示（未就绪 / capped）

See [RELEASE_NOTES_v1.3.4.md](docs/RELEASE_NOTES_v1.3.4.md).

---

## [1.3.3] — 2026-06-05 · Python import · Agent 预算 · capped 提示

### Added

- **v1.3.3 I1**：`pythonImportNavigation` · `from lib.util import` F12 链
- **v1.3.3 I2**：`AGENT_INDEX_CONTEXT_MAX_CHARS` · `trimAgentIndexContextSection`
- **v1.3.3 I3**：设置页索引 capped 文案 + 语义检索引导

See [RELEASE_NOTES_v1.3.3.md](docs/RELEASE_NOTES_v1.3.3.md).

---

## [1.3.2] — 2026-06-05 · Tab/断点/插件样例抛光

### Added

- **v1.3.2 T1**：`tabCompletionRequestGate` · Tab 早退 · debounce 350ms · EOF cache key · 失败原因指标
- **v1.3.2 T2**：条件断点 CDP 单测扩展 · `BROWSER_LIMITATIONS` CDP vs inject
- **v1.3.2 T3**：`fixtures/plugins/community-sample` · `PLUGIN_COMMUNITY_SAMPLE.md` · `seed-plugin-review.mjs` · plugin-ops E2E seed

### Docs

- [RELEASE_NOTES_v1.3.2.md](docs/RELEASE_NOTES_v1.3.2.md) · [V1.3.2_KICKOFF.md](docs/V1.3.2_KICKOFF.md)

See [RELEASE_NOTES_v1.3.2.md](docs/RELEASE_NOTES_v1.3.2.md).

---

## [1.3.1] — 2026-06-05 · GA 收口 · 生产 smoke 1.3.x

### Fixed

- **E2E**：`plugin-ops` 登录 fetch shim · 审核筛选 · 移除 flaky toolbar 等待
- **Stack E2E**：云工作区乐观 cloud 列表 · 徽章断言稳定
- **生产 smoke**：`smoke-production` 接受 health `1.3.x`（`smoke-health-version.mjs`）

### Changed

- `getReleaseVersion()` fallback → `1.3.1`

### Docs

- [RELEASE_NOTES_v1.3.1.md](docs/RELEASE_NOTES_v1.3.1.md) · [V1.3.1_KICKOFF.md](docs/V1.3.1_KICKOFF.md) · [V1.3_ENV.md](docs/V1.3_ENV.md) 生产推荐

See [RELEASE_NOTES_v1.3.1.md](docs/RELEASE_NOTES_v1.3.1.md).

---

## [1.3.0] — 2026-06-05 · Python/索引2.0/Agent平台 F1–F7

### Added

- **v1.3 F1**：Python `def`/`class` 符号 · 跨文件 F12 · E2E `py-cross-file-navigation`
- **v1.3 F2**：`embeddingPersistCache` · `indexBuildTelemetry` · 设置页索引耗时
- **v1.3 F3**：`SettingsBackgroundAgentCard` · `getBackgroundAgentFeatureStatus`
- **v1.3 F4**：`SettingsTabCompletionCard` · Tab 指标重置
- **v1.3 F5**：`buildAgentIndexContextSection` 注入 Agent prompt
- **v1.3 F6**：插件审核列表 total/pending 计数
- **v1.3 F7**：`v13Features` · `SettingsV13FeaturesCard` · E2E `v13-features`

### Docs

- [RELEASE_NOTES_v1.3.0.md](docs/RELEASE_NOTES_v1.3.0.md) · [V1.3_KICKOFF.md](docs/V1.3_KICKOFF.md) · F1–F7 阶段文档

See [RELEASE_NOTES_v1.3.0.md](docs/RELEASE_NOTES_v1.3.0.md).

---

## [1.2.9] — 2026-06-05 · 引用精度/MCP 动态预留/插件审核运维

### Added

- **v1.2.9 F1**：`monacoLocationToReference` · Peek 优先 TS Worker · opener 列号 · 引用 E2E 行号断言
- **v1.2.9 F2**：`mcpPayloadReserve` 动态表计 · `refreshMcpToolCountEstimate` · forceSlim/mention 单测
- **v1.2.9 F3**：`GET /api/plugins/publish/reviews/:reviewId` · `?status=pending` · 设置页审核筛选 · plugin-ops E2E

### Docs

- [RELEASE_NOTES_v1.2.9.md](docs/RELEASE_NOTES_v1.2.9.md) · F1–F3 阶段文档

See [RELEASE_NOTES_v1.2.9.md](docs/RELEASE_NOTES_v1.2.9.md).

---

## [1.2.8] — 2026-06-04 · 引用 Peek/MCP/插件发布 DB

### Added

- **v1.2.8 F1**：`monacoGoToReferencesAt` · 跨文件引用 E2E · `ReferencesPeekBar`（`references-peek`）
- **v1.2.8 F2**：`CHAT_PAYLOAD_MCP_RESERVE_BYTES` · Agent MCP 表计脚注 · 重名 `@`「精简发送」
- **v1.2.8 F3**：`PluginPublishReview` Prisma · DB 持久化 publish/reviews · 插件 Manual 提交审核 · [PLUGIN_TRUST_PRODUCTION.md](docs/PLUGIN_TRUST_PRODUCTION.md)

### Docs

- [RELEASE_NOTES_v1.2.8.md](docs/RELEASE_NOTES_v1.2.8.md) · [V1.2.8_KICKOFF.md](docs/V1.2.8_KICKOFF.md) · F1–F3 阶段文档

See [RELEASE_NOTES_v1.2.8.md](docs/RELEASE_NOTES_v1.2.8.md).

---

## [1.2.7] — 2026-06-04 · 导航 E2E/Payload/运维

### Added

- **v1.2.7 F1**：`E2E_NAV_FILES` · `ts-cross-file-navigation.spec` · Monaco E2E harness
- **v1.2.7 F2**：语义/工具轮次 payload 预留 · `@` 重名发送阻断 · `chatPayloadParity` 单测
- **v1.2.7 F3**：设置页 plugin ops · `GET /api/plugins/publish/reviews` · 用量 80% 黄条 · provider 分桶

### Docs

- [RELEASE_NOTES_v1.2.7.md](docs/RELEASE_NOTES_v1.2.7.md) · [V1.2.7_KICKOFF.md](docs/V1.2.7_KICKOFF.md) · F1–F3 阶段文档

See [RELEASE_NOTES_v1.2.7.md](docs/RELEASE_NOTES_v1.2.7.md).

---

## [1.2.6] — 2026-06-04 · 语义导航/预检/生产开关

### Added

- **v1.2.6 F1 TS 语义导航**：Monaco TS Worker 定义/引用 · `file:///` 模型对齐 · 启发式回退
- **v1.2.6 F2 Agent 预检闭环**：未解析 `@` 阻断发送 · payload 表计 12KB reserve · 发送 estimate 漂移 telemetry
- **v1.2.6 F3 生产开关**：多根/虚拟树生产默认开 · 设置页 v1.2 只读状态 · `v12-features` E2E

### Docs

- [RELEASE_NOTES_v1.2.6.md](docs/RELEASE_NOTES_v1.2.6.md) · [V1.2.6_KICKOFF.md](docs/V1.2.6_KICKOFF.md) · F1–F3 阶段文档

See [RELEASE_NOTES_v1.2.6.md](docs/RELEASE_NOTES_v1.2.6.md).

---

## [1.2.5] — 2026-06-04 · 质量/生态 E2E

### Added

- **v1.2.5 F3 补丁/CI**：`ROADMAP_V1.2.x_PATCHES` · 发版门禁表 · `e2e-collab` 注释对齐必过
- **v1.2.5 F2 插件 E2E**：`plugin-helpers` · `plugin-trust.spec` 停用/启用 · 市场徽章
- **v1.2.5 F1 UI E2E**：`language-navigation.spec` · `command-helpers` · `E2E_SYMBOL_FILES` 大纲 smoke

### Docs

- [RELEASE_NOTES_v1.2.5.md](docs/RELEASE_NOTES_v1.2.5.md) · [V1.2.5_KICKOFF.md](docs/V1.2.5_KICKOFF.md)

See [RELEASE_NOTES_v1.2.5.md](docs/RELEASE_NOTES_v1.2.5.md).

---

## [1.2.4] — 2026-06-04 · Agent/索引/E2E

### Added

- **v1.2.4 F1 转到引用**：`goToReferences` · 命令面板 Shift+F12 · 引用 Provider 并入 `languageServiceHost` · 大纲作用域前缀与缩进
- **v1.2.4 F2 Agent 上下文**：聊天区 payload 预算条 · `@` 预检（未解析/超限/重名）· 大仓索引 capped 提示
- **v1.2.4 F3 全栈 E2E**：`fullstack-helpers` · API session 冒烟 · 云端工作区列表断言 · serial/workers:1

### Docs

- [RELEASE_NOTES_v1.2.4.md](docs/RELEASE_NOTES_v1.2.4.md) · [V1.2.4_KICKOFF.md](docs/V1.2.4_KICKOFF.md) · F1–F3 阶段文档

See [RELEASE_NOTES_v1.2.4.md](docs/RELEASE_NOTES_v1.2.4.md).

---

## [1.2.3] — 2026-06-04 · 产品深度

### Added

- **v1.2.3 F1 语言服务**：`languageServiceHost` · 命令面板「转到定义」/ F12 · Provider 去重
- **v1.2.3 F5 协作 E2E**：Collab smoke 串行 · helper 关闭登录遮罩 · 重连单测 · CI `e2e-collab` 必过
- **v1.2.3 F4 平台 AI 用量仪表盘**：`GET /api/usage/dashboard` · `ai_platform_request` 分类型统计 · 设置页 7 日柱状图与估算成本
- **v1.2.3 F3 Tab 补全**：FIM → 平台 AI → 对话回退 · `inlineCompletionMetrics` · 设置防抖与路径说明
- **v1.2.3 F2 多根 + 虚拟文件树**：dev 默认多根与虚拟列表 · 删根清理 IndexedDB autosave · `clampActiveFileIndex`

### Fixed

- `unifiedStorage.remove` 正确删除 IndexedDB settings · 集成测试配额 5000/日边界 · UI E2E i18n 选择器与窄屏侧栏收起

### Docs

- [RELEASE_NOTES_v1.2.3.md](docs/RELEASE_NOTES_v1.2.3.md) · [V1.2.3_KICKOFF.md](docs/V1.2.3_KICKOFF.md) · F2–F5 阶段文档

See [RELEASE_NOTES_v1.2.3.md](docs/RELEASE_NOTES_v1.2.3.md).

---

## [1.2.2] — 2026-06-04 · Workbench Shell

### Added

- **v1.2.2 F1 Workbench Shell**：`workbenchLayout` 辅助面单槽互斥 · `WorkbenchAuxiliaryHost` docked 列 · 搜索/预览/审查/性能不再叠在编辑区上
- **v1.2.2 F2 Layer 刻度**：`layers.css` / `layers.ts` · Modal/Command/Toast/Confirm 统一 z-index · 移除 `10000` 等散落值
- **v1.2.2 F3 视觉密度**：Chat 消息/输入区间距缩减 ~30% · Toolbar 高度 48→40px · Settings 卡片/内边距缩减 ~20% · 右栏宽度 380→360px · token `--toolbar-height` 同步更新
- **v1.2.2 F4 面板 Resize**：侧栏/右栏拖拽调宽（Pointer Events）· 宽度 localStorage 持久化 · 窄屏≤900px 自动折叠侧栏 · 双击恢复默认宽度
- **v1.2.2 F5**：E2E `workbench-layout.spec.ts` · 单测 `workbenchLayout` / `layers` / `panelWidthPrefs`

### Changed (v1.2.1 track, 同仓合入)

- **调试**：`DebugSession` 抽象 · 条件断点 / `hitCount` · Watch 只读（最多 3 条）· `languageServiceHost` 统一跳定义入口

### Fixed

- 免费计划 AI 日配额测试与 **5000/日** 产品策略对齐 · ja 覆盖 `debug.*` / `subscription.*` / `toolbar.welfare.*`

### Docs

- [ADR_V1.2_WORKBENCH_SHELL.md](docs/ADR_V1.2_WORKBENCH_SHELL.md) · [V1.2.2_KICKOFF.md](docs/V1.2.2_KICKOFF.md) · [WORKBENCH_QA.md](docs/WORKBENCH_QA.md) · [RELEASE_NOTES_v1.2.2.md](docs/RELEASE_NOTES_v1.2.2.md)

See [RELEASE_NOTES_v1.2.2.md](docs/RELEASE_NOTES_v1.2.2.md).

---

## [1.2.0] — 2026-06-01 · 多根工作区 + 插件可信市场

### Added

- **F1** 多根工作区：`workspaceRoots` · 侧栏根切换 · 按根 autosave · 协作绑定根 · E2E `multi-root.spec.ts`
- **F2** 大文件树：≥250 默认折叠 · ≥500 虚拟滚动 · `projectIndexManager` 按根隔离
- **F3** 插件信任：`trustTier` · Ed25519 签名校验 · 市场信任徽章 · `scripts/sign-plugin-manifest.mjs`
- **F4** `POST /api/plugins/publish` 草案 · health `plugins` 块 · `PLUGIN_PUBLISH_ENABLED`
- **F5** E2E：`plugin-market.spec.ts` · `v12-workspace-plugins.spec.ts` · localStorage 功能开关

### Docs

- [V1.2_KICKOFF.md](docs/V1.2_KICKOFF.md) · [V1.2_MASTER_PLAN.md](docs/V1.2_MASTER_PLAN.md) · [RELEASE_NOTES_v1.2.0.md](docs/RELEASE_NOTES_v1.2.0.md)
- 功能开关：[V1.2_ENV.md](docs/V1.2_ENV.md) · `src/lib/v12Features.ts`（默认 **关**：`VITE_MULTI_ROOT` · `VITE_PLUGIN_TRUST_MARKET` · `VITE_VIRTUAL_FILE_TREE`）

See [RELEASE_NOTES_v1.2.0.md](docs/RELEASE_NOTES_v1.2.0.md).

---

## [1.1.9.3] — 2026-06-01 · AI 聊天区布局

### Changed

- 单行控制条（模型 / 用量 / Agent·Plan·工作区图标）
- 索引与扩展信息默认折叠
- `QuotaIndicator` 支持 `inline` 变体

See [RELEASE_NOTES_v1.1.9.3.md](docs/RELEASE_NOTES_v1.1.9.3.md).

---

## [1.1.9.1] — 2026-06-01 · SDK 2 抛光

### Added

- **v1.1.8.4**：设置页展示 `GET /api/health` → `platformAi` 状态
- **插件 UI**：已安装列表 SDK 徽章、SDK 2 说明与文档链接
- **协作 E2E**：`data-testid="collab-create-join-primary"` 稳定选择器
- **Smoke**：`/api/health` → `platformAi.configured`

### Docs

- [RELEASE_NOTES_v1.1.9.1.md](docs/RELEASE_NOTES_v1.1.9.1.md)
- [ROADMAP_V1.1.9.x_PATCHES.md](docs/ROADMAP_V1.1.9.x_PATCHES.md)
- [PRODUCT_STATE_REVIEW_2026-06.md](docs/PRODUCT_STATE_REVIEW_2026-06.md) — 产品深审与增长路径

---

## [1.1.9] — 2026-06-01 · 插件 SDK 2.0

### Added

- **插件 SDK 2.0**：`context.ai.getMode()`、`context.debug.getSummary()`、权限 `debug:read`
- **官方市场**：示例插件 `sdk-v2-status`（SDK 2 徽章）
- **v1.1.8.x 抛光**：插件/Tab 补全平台 AI、Chat 未登录平台提示

See [RELEASE_NOTES_v1.1.9.md](docs/RELEASE_NOTES_v1.1.9.md) · [PLUGIN_SDK_V2.md](docs/PLUGIN_SDK_V2.md).

---

## [1.1.8] — 2026-05-31 · 平台 AI + 注册 SEO + 调试抛光

### Added

- **平台 AI（Cursor 模式）**：`POST /api/ai/chat` · 服务端 Key · 设置「平台 AI / BYOK」· Chat + Agent 无 Key 可用 · `health.platformAi`
- **可发现注册**：`/signup` · `/login` · `robots.txt` · `sitemap.xml` · `?auth=register` · 欢迎页注册 CTA
- **调试 1.1.7.2**：Electron 本地文件夹 `node --inspect-brk` · Desktop / WebContainer 标签
- **调试 1.1.7.3**：断点多 `urlRegex` · CDP 断开清理 · inspect 连接重试

See [RELEASE_NOTES_v1.1.8.md](docs/RELEASE_NOTES_v1.1.8.md).

---

## [1.1.7] — 2026-05-29 · 调试器 MVP GA

### Added

- **Debug 面板**：WebContainer `node --inspect-brk` attach · 断点 gutter · CDP 同步 + 注入回退
- **调用栈与 locals**：暂停时只读展示 · 栈帧跳转编辑器
- **执行控制**：Continue / Step Over·Into·Out · F5/F10/F11 快捷键 · Run 互斥
- **命令面板**：`command.debug.*` · ja-JP 全量 · `Ctrl+Alt+4` Debug tab
- **协作**：Viewer 不可调试（断点 gutter / 启动 / 单步均拦截）

See [RELEASE_NOTES_v1.1.7.md](docs/RELEASE_NOTES_v1.1.7.md).

---

## [1.1.7.4] — 2026-05-29 · v1.1.7 F5

### Added

- **i18n F5**：`debug.*` / `command.debug.*` / `panel.debug.*` 全量 ja 覆盖 + `debugI18nJa.test.ts`
- **命令面板**：开始调试 · 打开调试面板 · 继续/单步/停止（含快捷键提示）
- **快捷键**：`Ctrl+Alt+4` 打开调试底栏；欢迎页调试快捷键说明

---

## [1.1.7.3] — 2026-05-29 · v1.1.7 F4

### Added

- **执行控制 F4**：Continue（F5）· Step Over（F10）· Step Into/Out（F11 / Shift+F11）
- CDP `Debugger.resume` / `stepOver` / `stepInto` / `stepOut`
- 调试中与 Run / npm 脚本互斥；工具栏与终端 Run 禁用

---

## [1.1.7.2] — 2026-05-29 · v1.1.7 F3

### Added

- **调用栈 F3**：CDP `Debugger.paused` 解析 `callFrames`；Debug 面板列表 · 点击跳转编辑器
- **局部变量 F3**：`Runtime.getProperties` 只读展示；对象一层预览
- **注入回退**：栈/变量区提示需 CDP 同步

---

## [1.1.7.1] — 2026-05-29 · v1.1.7 F2

### Added

- **断点 F2**：启用/禁用（Alt+点击 · 面板 checkbox · 灰色 gutter）
- **CDP 断点同步**：连接 inspect 后 `Debugger.setBreakpointByUrl` + `resume`
- **回退**：CDP 不可用时 `debugger;` 注入；会话 `running` / `paused` 状态

---

## [1.1.6.8] — 2026-05-29

### Added

- **Electron git spike（只读）**：本地文件夹 bound 时优先 `git status` / `branch` CLI；失败回退 isomorphic-git
- `parseGitPorcelain` · `desktop:git-readonly-snapshot` · 面板「磁盘 Git」徽章与开关

See [GIT_DESKTOP_CLI_SPIKE.md](docs/GIT_DESKTOP_CLI_SPIKE.md).

---

## [1.1.6.7] — 2026-05-29

### Added

- Git status **防抖**（300ms）：`GitPanel` / `useGitStatus` 文件保存风暴合并刷新
- **仅手动刷新**开关（localStorage）：跳过后台自动 status 同步，保留刷新按钮与 Git 操作后同步

---

## [1.1.6.6] — 2026-05-29

### Added

- Git **历史筛选**：已加载 commit 客户端过滤（message / author / SHA / 已展开提交的路径）；搜索框 + 空状态提示

---

## [1.1.6.5] — 2026-05-29

### Added

- **1.1.6.5** 大 diff 自动切换 **内联** Monaco 布局（`gitDiffLayout`）；保留 1.1.6.1 截断兜底
- **v1.1.7 Alpha**：底栏 **调试** 面板、编辑器断点 gutter、`node --inspect-brk` WebContainer 附着实验（`debugAlphaService`）

---

## [1.1.6.4] — 2026-05-29

### Added

- **ja-JP** 补全：`empty.git.*` · `status.gitTitle`；`command.git` bulk 修正
- `gitI18nJa.test.ts`：断言全部 Git 相关 UI 键有显式 ja 覆盖

---

## [1.1.6.3] — 2026-05-29

### Added

- Git 历史 **load more**：默认 50 条/页，从末条 commit 的 parent 续拉；`gitLogPagination` 去重合并

---

## [1.1.6.2] — 2026-05-29

### Fixed

- **statusMatrix** 按 isomorphic-git 语义重映射：暂存删除（`D `）、未暂存删除（` D`）、新文件暂存等
- **getStagedDiff**：无 HEAD 仓库、暂存删除（index 侧为空）、仅 index 新文件；打开前校验 HEAD≠STAGE

### Added

- `gitStatusMatrix.ts` 单元测试（官方 matrix 用例表）

---

## [1.1.6.1] — 2026-05-29

### Added

- Git diff tab **截断**：单侧超过 **2000 行** 或 **512KB** 时仅渲染前缀，编辑器提示条 + 「已截断」徽章
- `gitDiffContentLimits` · `prepareGitDiffForEditor` 单元测试

---

## [1.1.6] — 2026-05-29

### Added

- **F1** 编辑器内 Git diff tab：`GitDiffEditor` · `gitDiffTabs` · `openGitDiffTab` / `closeGitDiffTab`；`EditorTab` `kind: 'git-diff'`
- **F2** Stage UX：`getStagedDiff` · `stageAllUnstaged` · 状态栏 / 命令面板 **Stage all**；staged diff 入口；`diffSource: 'workdir' | 'staged' | 'commit'`
- **F3** Log drill-down：`getCommitChangedFiles` · `getCommitFileDiff`；历史 commit 展开文件列表 → commit diff tab
- **F4** 分支：`createBranch` · `isValidBranchName`；Git 空态 `InlineStatePanel`；`shouldShowGitStatusPerfHint`（≥100 变更）
- **F5** 全部 **`git.*`** ja-JP；**Ctrl+Shift+G** Git 面板；Welcome Git 快捷键与功能描述
- 工具：`formatGitRelativeTime` · `gitQuickActions` · `openGitDiffTab` 测试

### Changed

- `GitPanel` / `RightPanel` / `EditorLayout` 联动 inline diff（modal 保留给 Agent apply）
- 版本 **1.1.6**（`VITE_APP_VERSION` / health / 欢迎页徽章）

### Docs

- [RELEASE_NOTES_v1.1.6.md](docs/RELEASE_NOTES_v1.1.6.md) · [V1.1.6_GA_EXECUTION.md](docs/V1.1.6_GA_EXECUTION.md)

---

## [1.1.5.5] — 2026-05-29

### Added

- **Electron PTY spike**：`electron/ptyBridge.mjs` + IPC 流式终端；无 `node-pty` 时回退 line REPL
- 文档：[PTY_SPIKE_v1.1.5.5.md](docs/PTY_SPIKE_v1.1.5.5.md)
- `node-pty` 列为 **optionalDependency**

## [1.1.5.4] — 2026-05-29

### Added

- 终端 **多 session**（最多 4 个）：tab 切换 · scrollback 分 session 保存 · 元数据持久化
- 切换 session 时 WebContainer **jsh 重建**（仅活动 session 占 live shell）

---

## [1.1.5.3] — 2026-05-29

### Added

- Tasks 面板 **分组折叠**（持久化 `tasks-panel-collapse`）
- 大清单每组默认 preview **12 项** +「再显示 N 项」
- 已完成分组在 ≥24 项时 **自动折叠**
- 全完成 / 无匹配 **InlineStatePanel** 空态与 i18n

---

## [1.1.5.2] — 2026-05-29

### Added

- NPM Scripts **last-run 持久化**（localStorage）与成功/失败行高亮
- 交互 shell 跑 script 时 **等待终端结果**（exit code / npm ERR 检测）
- i18n：`scripts.lastRunSuccess/Error`、`notify.scriptExitCode/TimeoutDetail`

### Fixed

- 从 Scripts 面板跑 script 在 jsh 模式下无 Toast 反馈

---

## [1.1.5.1] — 2026-05-29

### Fixed

- WebContainer **jsh** 终端随底栏高度 / xterm 尺寸 **resize 同步**（`shell.resize`）
- 底栏双击恢复高度使用 `BOTTOM_PANEL_DEFAULT_HEIGHT` 常量

### Added

- 底栏 tab 快捷键：**Ctrl+Alt+1/2/3** → Terminal / Scripts / Tasks
- **ja-JP** `terminal.*` 字符串覆盖
- `scripts/publish-github-release.mjs`（UTF-8 Release 发布工具）

### Removed

- 废弃只读 `Terminal.tsx`（已由 `IntegratedTerminal` 取代）

### Docs

- [ROADMAP_V1.1.5.x_PATCHES.md](docs/ROADMAP_V1.1.5.x_PATCHES.md)

---

## [1.1.5] — 2026-05-29

### Added

- **F1** 交互式终端：`IntegratedTerminal`（xterm.js）、WebContainer **jsh** shell、桌面 line REPL、`terminalSession` Agent 上下文
- **F2** 底栏 **NPM Scripts** 面板：`NpmScriptsPanel` · `usePackageScripts` · 多 `package.json` 聚合
- **F3** 底栏 **Tasks** 面板：`.aide/tasks.md` + spec tasks 分组 · 搜索 · Send to Agent
- **F4** 底栏 UX：三 tab · 拖拽高度 · `bottom-panel-prefs` 持久化 · 视口 resize 钳制
- **F5** 底栏/Scripts/Tasks **ja-JP**；`Ctrl+`` 终端切换提示；Welcome 快捷键列表
- 依赖：`@xterm/xterm` · `@xterm/addon-fit`

### Changed

- `BottomPanel` 取代只读 `Terminal` 嵌入 `EditorLayout`；Command Palette / Settings 联动 Scripts / Tasks 面板
- 版本 **1.1.5**（`VITE_APP_VERSION` / health / 欢迎页徽章）

### Docs

- [RELEASE_NOTES_v1.1.5.md](docs/RELEASE_NOTES_v1.1.5.md) · [V1.1.5_GA_EXECUTION.md](docs/V1.1.5_GA_EXECUTION.md)

---

## [1.1.4] — 2026-05-30

### Added
- **F2** Monaco TS **≤80** extra libs、侧栏 **≥80** 文件筛选、诊断错误/警告分级、**format-on-save**、F12 扫描 **≤120** 文件
- **F3/F4** **ja-JP** UI 语言；Phase 2 前缀 **100%** ja 覆盖；`apiMessages` **ja-JP**
- **F5** `InlineStatePanel` 统一空态/提示；Welcome 首登引导；503 Toast **跳转设置**；大工作区状态栏 performance hint
- 脚本：`npm run i18n:ja-bulk` · [I18N_PHASE2_AUDIT.md](docs/I18N_PHASE2_AUDIT.md)

### Changed

- 版本 **1.1.4**（`VITE_APP_VERSION` / health / 欢迎页徽章支持 1.1.x）

### Docs

- [RELEASE_NOTES_v1.1.4.md](docs/RELEASE_NOTES_v1.1.4.md) · [V1.1.4_GA_EXECUTION.md](docs/V1.1.4_GA_EXECUTION.md)

---

## [1.1.3.9] — 2026-05-30

### Added

- 云端 autosave **`sanitizeWorkspaceFilesForCloud`**：跳过二进制/超大文件、限制数量与 body 体积，降低工作区 **413**
- 部分上传与 413 失败 **Toast**（`workspace.cloudSave.*` i18n）
- 文档：[WORKSPACE_CLOUD_SAVE.md](docs/WORKSPACE_CLOUD_SAVE.md)

### Changed

- `authService.saveWorkspace` 返回 `WorkspaceCloudSaveResult`；本地 IndexedDB 仍保存完整工作区

---

## [1.1.3.8] — 2026-05-30

### Added

- 协作 e2e：`data-testid`、中英双语选择器、信令徽章断言
- CI **`e2e-collab`** job（`continue-on-error: true`）
- [COLLAB_M1_SMOKE.md](docs/COLLAB_M1_SMOKE.md) **Livekit 生产手测** 小节

---

## [1.1.3.7] — 2026-05-30

### Added

- 协作 **角色实时同步**：Yjs Map `collab-member-roles`，主持人 API 成功后 publish；成员经 `useCollabRoleSync` 即时收到角色变更
- 协作面板 **信令模式** 徽章（Livekit / WebRTC）与断开 hint
- `formatCollabApiError`：房间 REST 按 HTTP 状态返回可区分文案

### Changed

- 角色轮询降为 **120s** 慢轮询，仅兜底踢人 / 成员校验
- 更新协作 Beta / hero / M1 limits 中英 copy

---

## [1.1.3.5] — 2026-05-30

### Fixed

- 协作 **创建房间 HTTP 500**：Neon HTTP 驱动不支持 Prisma 嵌套 `create`；改为分步创建 `CollaborationRoom` + `CollaborationMember`

---

## [1.1.3.3] — 2026-05-30

### Added

- 协作 **光标/选区 awareness**：同文件内远程光标与选区高亮（Monaco decorations + Yjs awareness）
- `updateEditorPresence`（80ms 节流）、`useCollabEditorPresence` hook
- 协作成员列表显示当前编辑文件

---

## [1.1.3.2] — 2026-05-29

### Added

- 协作 **Livekit 客户端**：API 返回 `signaling.mode: livekit` 且含 `livekitUrl` + `livekitToken` 时，Yjs 经 LiveKit data channel 同步（`LivekitYjsProvider`）；否则仍走 y-webrtc
- 依赖：`livekit-client`
- JWT grant 增加 `canPublishData`

---

## [1.1.3.1] — 2026-05-29

### Added

- 协作 **角色轮询同步**（≈20s / 回到前台）：Host 改角色后成员自动切换只读/编辑
- 被 **踢出** 时 Toast + 自动断开 Yjs；`fetchCollabRoom` + `useCollabRoleSync`
- 文档：[ROADMAP_V1.1.3.x_PATCHES.md](docs/ROADMAP_V1.1.3.x_PATCHES.md)

---

## [1.1.3] — 2026-05-29（协作 M1）

### Added

- **协作 M1**：`CollaborationRoom` / `CollaborationMember`、房间 CRUD + join API
- `VITE_COLLAB_M1_SIGNAL` + 协作面板对接服务端房间
- `CollaborationService` 重连状态机、退避重连、`POST …/leave`
- 可选 Livekit JWT；`COLLAB_SIGNALING_URL(S)` 配置
- **viewer 只读**、Host 改角色 / 踢人 API
- 双浏览器 Playwright smoke（`npm run test:e2e:collab`）与 API 集成段
- 文档：`COLLAB_M1_*`、`RELEASE_NOTES_v1.1.3.md`

### Notes

- AI 网关 → **v1.2**；生产协作开关默认 **off**

---

## [1.1.2.8] — 2026-05-29

### Added

- 后台任务完成 **Toast / 桌面通知可点击** → 打开「后台任务」Tab
- 任务详情 **复制 Prompt**
- 列表项 **快速重试**（失败/已取消）

---

## [1.1.2.7] — 2026-05-29

### Added

- Plan **批量后台**：`POST /api/jobs/batch`、步骤去重、跳过已在队列中的同计划步骤
- 计划目录 **全部后台运行 ({count})** 按钮
- `planBackgroundJobsService` 统一排队逻辑

---

## [1.1.2.6] — 2026-05-29

### Added

- **`/api/jobs/process` 可观测**：响应含 `workerMode`、`startedAt`、`finishedAt`、`durationMs`；每 job 结构化日志

### Changed

- Cron 运维文档：Hobby 日 Cron vs 本地 `npm run jobs:process`（见 [BACKGROUND_AGENT_QUICKSTART.md](docs/BACKGROUND_AGENT_QUICKSTART.md)）

---

## [1.1.2.5] — 2026-05-29

### Added

- **真 Agent Worker（云）**：`BACKGROUND_JOB_WORKER_MODE=agent` 时服务端读云工作区 → Agent 工具循环 → `pendingChanges` + 云回写
- 环境变量：`BACKGROUND_AGENT_API_KEY`（必填）、`BACKGROUND_AGENT_PROVIDER`、`BACKGROUND_AGENT_MODEL`、`BACKGROUND_AGENT_MAX_ROUNDS`
- 模块：`lib/api/backgroundAgent*.ts`（无 DOM / WebContainer 依赖）

---

## [1.1.2.4] — 2026-05-29

### Added

- 后台任务 **重试**（失败/已取消 → 同 prompt 重新提交）
- 列表 **筛选**：全部 / 进行中 / 已结束
- Plan 任务 **标记步骤完成** + 可选 **完成时自动勾选**（解析 `buildPlanBackgroundJobPrompt`）

### Fixed

- Vercel **Hobby** 部署：`/api/jobs/process` Cron 改为每日 `0 4 * * *`（原 `*/5` 超出 Hobby 限额）

---

## [1.1.2.3] — 2026-05-29

### Added

- **Plan → 后台**：计划目录 **后台运行** 将选中步骤提交为 `POST /api/jobs`（`buildPlanBackgroundJobPrompt`）

---

## [1.1.2.2] — 2026-05-29

### Added

- 后台任务详情 **应用到 IDE**：`mergeJobChangesIntoFileItems` 一键合并 `pendingChanges` 到当前编辑器

---

## [1.1.2.1] — 2026-05-29

### Added

- 后台任务完成 **Toast + 桌面通知**（可开关，默认开启）
- 工具栏 / 右栏 Tab **进行中任务数徽章**（`useBackgroundJobsTracker` 全局轮询）

---

## [1.1.2] — 2026-05-29（后台 Agent MVP）

### Added

- **后台 Agent**：Prisma `BackgroundJob`；`POST/GET /api/jobs`、`/api/jobs/:id/cancel`
- **Worker**：`GET|POST /api/jobs/process`（Cron `*/5 * * * *`）；dummy 模式可跑通；硬超时 ≤30min
- **客户端**（`VITE_BACKGROUND_AGENT=true`）：`BackgroundJobsPanel`、右栏 Tab、工具栏入口；Chat **后台运行**
- **云回写**：任务成功合并 `pendingChanges` 到云工作区；面板 **预览 Diff**
- **配额**：Free 2/日、1 并发；Pro+ 100/日、5 并发（429 + 升级文案）
- 脚本：`npm run jobs:process`、`npm run jobs:verify-cron`

### Docs

- [BACKGROUND_AGENT_QUICKSTART.md](docs/BACKGROUND_AGENT_QUICKSTART.md)、[V1.1.2_GA_EXECUTION.md](docs/V1.1.2_GA_EXECUTION.md)、[RELEASE_NOTES_v1.1.2.md](docs/RELEASE_NOTES_v1.1.2.md)

### Known limitations

- 浏览器本机盘无法后台写盘 → 云工作区优先；非 Plan 队列后台化；Worker 默认 dummy

---

## [1.1.1] — 2026-05-29（计划系统 GA）

### Added

- Plan 系统 GA：多计划目录、双执行队列、报告目录、溯源、总览、模板、报告清理（见 [PLAN_SYSTEM_QUICKSTART.md](docs/PLAN_SYSTEM_QUICKSTART.md)）
- Plan Catalog / Spec Catalog / Report Catalog 与设置中心统一管理 UI
- 计划模板（内置 3 套 + `.aide/plans/_templates/`）
- Plan ↔ Spec 溯源（`.aide/meta/plan-spec-links.json`）与双向跳转
- 报告恢复预览、复制计划、计划步骤手动标记完成、`.aide` 同步到工作区索引
- 任务队列面板 `TaskQueuePanel`、长队列预览展开

### Changed

- Chat：Agent 模式默认常开；Plan 执行确认、自动勾选步骤、队列持久化（schema v1）、报告保存与恢复
- Plan → Spec → Chat 闭环：映射、映射并执行、失败重试/跳过、队列入队去重
- 队列可观测：当前项、预览、成功/失败统计、最近完成、导出/保存报告
- Plans / Specs / Reports / 任务队列 UI 中英 i18n
- Plan 执行服务：`listPlanSteps`；回填日志增加 `provider/model/summary`
- Fix：启动不再因 referrer 跳过工作区恢复；Chat 消息与输入草稿本地持久化

### Docs

- [V1.1.1_GA_EXECUTION.md](docs/V1.1.1_GA_EXECUTION.md)、[ROADMAP_V1.1.1.x.md](docs/ROADMAP_V1.1.1.x.md)

---

## [1.0.8] — 2026-05-28（质量收口：编排/语义/测试/边界）

### Changed

- Chat：抽离会话编排层（状态/队列/runId），统一会话状态语义，降低 `ChatPanel` 复杂度
- Quota：`aiService` / `agentChatCompletion` 配额预留逻辑收敛到 `usageService`
- MCP：结构化结果面板提炼可测纯函数（过滤/按 Server 分组），补齐单测
- Specs：spec 任务执行回填内容生成提炼为独立服务函数并补测试
- Test：Vitest 增加覆盖率阈值门槛（基础门槛，后续可逐步提高）

## [1.0.7.3] — 2026-05-27（聊天完成度）

### Added

- 聊天消息 **基础 Markdown**（列表、引用、表格、标题、行内代码/链接）
- 代码块 **一键复制** + 已复制反馈
- 消息操作：**复制 / 重试 / 继续**
- 统一失败态文案（网络、认证、配额、413、中止）与气泡样式

### Added (modules)

- `src/lib/chatMarkdownLite.ts`
- `src/components/ChatMessageActions.tsx`
- `src/services/chatErrorMessages.ts`

## [1.0.7] — 2026-05-27（体验抛光 · 8 项）

### Summary

- **v1.0.7** 八项「小优化 · 大收获」：聊天可控、侧栏可读、上限可感知、413 可行动
- 详见 [V1.0.7_MASTER_PLAN.md](docs/V1.0.7_MASTER_PLAN.md) · [RELEASE_NOTES_v1.0.7.md](docs/RELEASE_NOTES_v1.0.7.md)

### Added / Changed

1. **聊天可停止生成** — `AbortController`，生成中发送钮为暂停
2. **Agent 默认开启并记忆** — `ai-ide:chat-agent-mode` 默认 `true`
3. **左侧文件树** — 路径分层；语言标签取消全大写
4. **文件上限可视化** — `WorkspaceCapacityBanner`、工具栏 `当前/上限`（浏览器 500 / 桌面 2000）
5. **Chat UI v2** — 会话卡层次、消息代码块、`chat-panel--v2` 输入浮层
6. **413 友好提示** — 识别请求过大并给出缩减上下文步骤
7. **文件树展开/折叠** — 侧栏按钮；≥8 文件自动展开第一层
8. **工作区上限与索引对齐** — `workspaceContextService` 使用 `getMaxIndexFiles()`（不再单独 100）

### Added (modules)

- `src/services/workspaceLimits.ts`
- `src/components/WorkspaceCapacityBanner.tsx`
- `src/components/ChatMessageBody.tsx`

## [1.0.6.4] — 2026-05-27（v1.0.6 收官）

### Summary

- **v1.0.6** 四段交付收官：Agent 工具面板 + 文件工具 · 工作区文件树增强 · 插件市场 6 款 + 筛选
- 竞品复评 **~2.90**（见 [COMPETITOR_COMPARISON_V1.0.2.md](docs/COMPETITOR_COMPARISON_V1.0.2.md) §0.2）
- 发布稿与 [RELEASE_NOTES_v1.0.6.4.md](docs/RELEASE_NOTES_v1.0.6.4.md) 就绪

## [1.0.6.3] — 2026-05-27（F3 插件目录扩充）

### Added

- 官方插件目录 **6 款**（+4）：JSON 格式化、TODO 扫描、行数统计、Markdown 预览+
- 插件市场 **标签筛选**（全部 / demo / tools / formatter / productivity / markdown / ui）
- 每款插件 **★ 评分徽章**（官方推荐分）

## [1.0.6.2] — 2026-05-27（F2 文件管理器增强）

### Added

- 工作区文件树 **右键菜单**：重命名、移动、删除、新建子文件夹
- **F2** 重命名、**Delete** 删除（选中行后）
- 工具栏 **新建文件夹** + 行内创建表单
- `workspaceContextService`：`renamePath` / `createDirectory` / `deletePath`
- 文件操作后自动 **重建项目索引**

## [1.0.6.1] — 2026-05-27（F4 + F1 · Agent 文件工具 + 工具面板）

### Added — F4 Agent 文件管理工具

- **`move_file`**：Agent 可重命名/移动文件（workspace + 磁盘同步）
- **`delete_file`**：Agent 可删除文件
- **`create_dir`**：Agent 可新建目录（`.gitkeep` 占位）
- `AGENT_TOOL_DEFINITIONS` 更新，系统提示补全三工具说明

### Added — F1 Agent 工具调用面板

- 新组件 `AgentToolPanel`：Agent 运行时在 Chat 内显示可折叠工具调用日志
- 每条工具记录含：图标 · 工具名 · 摘要 · 成功/失败徽章 · hunk 数 · 输出截断提示
- 点击可展开原始 detail，替代原有扁平文字活动列表

### Docs

- [V1.0.6_MASTER_PLAN.md](docs/V1.0.6_MASTER_PLAN.md) · [ROADMAP_V1.0.6.x.md](docs/ROADMAP_V1.0.6.x.md) · 各级 EXECUTION

## [1.0.5.1] — 2026-05-27（B1′ 运维 + MCP · 含部分 B2′）

### Added

- `npm run mcp:smoke` — MCP 预置目录、`/api/mcp/proxy` 与可选在线探测
- [MCP_OFFICIAL_CATALOG.md](docs/MCP_OFFICIAL_CATALOG.md) §故障 FAQ
- Chat：索引 **building** 时禁用 `@` 候选列表并提示
- 设置页索引卡片链至 [BROWSER_LIMITATIONS.md#capacity-limits](docs/BROWSER_LIMITATIONS.md#capacity-limits)
- 欢迎页 **发行说明** 链至 GitHub Release `v{version}`

### Docs

- [V1.0.5.x_MASTER_PLAN.md](docs/V1.0.5.x_MASTER_PLAN.md) · [ROADMAP_V1.0.5.x.md](docs/ROADMAP_V1.0.5.x.md) · 各级 EXECUTION

## [1.0.4] — 2026-05-27（体验巩固 · GA）

### Added

- **MCP 官方推荐**（≥3 预置、连接测试）— [MCP_OFFICIAL_CATALOG.md](docs/MCP_OFFICIAL_CATALOG.md)
- **项目规则** 设置内创建/编辑 `.aide/rules.md`，自动注入 Chat/Agent
- **Agent 上下文入门**：当前打开文件；可选终端最近输出（设置 → Agent）
- 欢迎页 **稳定版** 徽章（`1.0.3.x` 补丁位）

### 竞品与文档

- 复评综合分 **~2.80** — [COMPETITOR_COMPARISON_V1.0.2.md](docs/COMPETITOR_COMPARISON_V1.0.2.md) §0.1
- GA 清单：[V1.0.4_GA_EXECUTION.md](docs/V1.0.4_GA_EXECUTION.md)

### 自 RC

- 基于 `1.0.4-rc.1`；无破坏性 API 变更

## [1.0.4.3] — 2026-05-27（E3 检索 · onboarding 与索引卡片）

### Added

- 设置页语义检索 onboarding：无 Key/未开启提示（BYOK）
- Chat 首次 `@` 引导：索引就绪后可 dismiss（注入上下文提示）
- 设置页「索引与 @」状态卡片：展示索引状态、错误可重试，并链接浏览器能力边界

### Fixed

- 无需重做索引逻辑；仅补齐引导与可见性（保持与现有 `@` 注入/索引重试一致）

## [1.0.4.4] — 2026-05-27（E4 收官 · publish + live + 2.80 终稿）

### Docs

- 发布矩阵升版至 **v1.0.4.4**：CSDN / 掘金
- 竞品文档 **~2.80** 终稿：十一维表与收官摘要一致
- 1.0.4.x 路线图与执行清单补齐（E1′→E4）

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
