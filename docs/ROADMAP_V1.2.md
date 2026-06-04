# v1.2 规划（大拓展 · B 轨）

> **更新**：2026-06-01  
> **状态**：**v1.2.0 GA** ✅ · **v1.2.2 GA** ✅ · **v1.2.3 GA** ✅ · **v1.2.4 GA** ✅ · **当前**：v1.2.5 📋  
> **Kickoff**：[V1.2_KICKOFF.md](./V1.2_KICKOFF.md) · **Release**：[RELEASE_NOTES_v1.2.4.md](./RELEASE_NOTES_v1.2.4.md)

---

## 1. 定位

v1.2 为 **跨模块、大工程量** B 轨，在 v1.1.9（SDK 2.0 + 布局）与 **Smoke/Deploy Ready** 后启动。

| 子版本 | 主题 |
|--------|------|
| **v1.2.0** ✅ | 多根工作区 · 大文件树 · 插件可信市场 |
| **v1.2.1** ✅ | DAP/条件断点/Watch/LSP — 合入 v1.2.2 — [V1.2.1_KICKOFF.md](./V1.2.1_KICKOFF.md) |
| **v1.2.2** ✅ | **Workbench Shell** — [RELEASE_NOTES_v1.2.2.md](./RELEASE_NOTES_v1.2.2.md) |
| **v1.2.3** ✅ | **产品深度** — [RELEASE_NOTES_v1.2.3.md](./RELEASE_NOTES_v1.2.3.md) |
| **v1.2.4** ✅ | Agent/索引 · 全栈 E2E — [RELEASE_NOTES_v1.2.4.md](./RELEASE_NOTES_v1.2.4.md) |
| **v1.2.5** 📋 | 质量/生态抛光 — [V1.2.5_KICKOFF.md](./V1.2.5_KICKOFF.md) |

轨道 A：**1.2.0.x** patch（热修）。

---

## 2. v1.2.0 能力表

| 主题 | 说明 |
|------|------|
| 多根工作区 | `WorkspaceRoot[]` · 侧栏切换 · [ADR_V1.2_MULTI_ROOT.md](./ADR_V1.2_MULTI_ROOT.md) |
| 大仓 UI | 虚拟列表 / ≥250 文件折叠 |
| 插件可信 | Ed25519 签名 · `trustTier` · [ADR_V1.2_PLUGIN_TRUST.md](./ADR_V1.2_PLUGIN_TRUST.md) |
| 开关 | [V1.2_ENV.md](./V1.2_ENV.md) · `src/lib/v12Features.ts` |

---

## 3. 已下沉（勿重复）

| 能力 | 版本 |
|------|------|
| 平台 AI 网关、`/signup` SEO | v1.1.8 |
| 插件 SDK 2.0 API（`getMode` / `debug.getSummary`） | v1.1.9 |
| ActivityBar 布局 · AI 聊天紧凑条 | v1.1.9.3 |

---

## 4. v1.2.1 / v1.2.2（规划）

| 主题 | 说明 |
|------|------|
| 插件生态 2.0+ | 第三方审核 API · `debug.*` 扩展 |
| DAP / LSP | 多调试目标 · 全语言跳定义/引用 |
| 远程 SSH / 多根 | 远程目录挂载为根 |
| 平台 AI 运维 | 成本仪表盘、多模型路由、RPM |
| 企业 | SSO、专属模型、审计 |

---

## 5. 启动条件

- [x] v1.1.8 / v1.1.9 GA
- [x] 生产 Smoke / Deploy Ready
- [x] 插件 SDK 2.0 与权限模型
- [x] CI E2E（含 `e2e-ui` API+preview）

---

## 6. 文档索引

| 文档 | 用途 |
|------|------|
| [V1.2_GA_EXECUTION.md](./V1.2_GA_EXECUTION.md) | 发版清单 |
| [ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) | 1.1.x 世代 |
| [ROADMAP_V1.1.3_GATEWAY.md](./ROADMAP_V1.1.3_GATEWAY.md) | 网关历史草案 |
