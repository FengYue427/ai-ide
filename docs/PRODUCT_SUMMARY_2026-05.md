# AI IDE 本轮迭代总结（2026-05）

> **版本基线**：`v1.0.0-rc.1`  
> **范围**：P0～P3 执行收尾（Phase 4 公测体验 + IDE-1/2/3 + P3 差异化骨架）  
> **演示**：[ai-ide.vercel.app](https://ai-ide.vercel.app) · 仓库：`FengYue427/ai-ide`

---

## 1. 本轮完成了什么

### 1.1 Phase 4 — 公测体验（P2 收尾）

| 领域 | 交付 | 关键文件/能力 |
|------|------|----------------|
| 会话与配额 | 401 清会话、登录弹窗；Chat/设置统一配额展示 | `useSessionGuard`、`QuotaIndicator`、`quotaDisplay` |
| 计费 UX（路径 A） | 未接支付时公测横幅、「查看套餐」、按钮「公测免费」 | `SubscriptionModal`、`lib/billing/checkout` |
| 样式债 | Settings / Chat / Workspace / 协作 / 插件 模块化 CSS | `settings.css`、`chat.css`、`workspace-manager.css`、`collaboration.css`、`plugins.css` |
| 弹窗统一 | 主要 Modal → `ModalShell` + `modals.css` | Import、Template、Share、AISettings、协作、插件 |

### 1.2 IDE 能力（IDE-1/2/3，前期已落地，本轮文档对齐）

- 工作区索引、全局搜索替换、跳定义/查引用、符号大纲、`.aide/rules.md`、Agent 多文件应用与 Diff 块级接受。
- Chat 命令面板 `@` 提及（文件/符号选择）。

### 1.3 P3 — 差异化（本轮闭环）

| 项 | 状态 | 说明 |
|----|------|------|
| **Chat @ 上下文注入** | ✅ | `mentionContextService`：解析 `@file`、`@path#symbol`，注入 system prompt |
| **协作 Beta 标注** | ✅ | `CollaborationPanel` + 设置页「实时协作 · Beta」与限制说明 |
| **插件市场 M3 骨架** | ✅ | `pluginCatalogService` 官方目录 + `PluginManager` 三 Tab（已安装 / 市场 / 手动） |

### 1.4 工程质量

- **单元测试**：103 通过（`npm run test:local`）。
- **E2E**：CI 用 `webServer` 预启 preview；本地需先 `vite preview` 再跑 `test:e2e`。
- **部署**：Vercel 环境变量已配置（用户确认）；`main` 推送触发自动部署。

---

## 2. 产品现状一句话

**开源浏览器 AI IDE**：Monaco + WebContainer + BYOK 直连模型；可选账号、云工作区、订阅骨架与国内支付/Stripe 占位；对标 Cursor/Kiro 的「日常主力 IDE」仍差约一代（综合 ~1.8 → 目标 ~3.2，见 [IDE_GAP_CHECKLIST.md](./IDE_GAP_CHECKLIST.md)）。

---

## 3. 架构未变的核心约束

1. **AI 不经平台托管**：密钥在浏览器，服务端只做 `consumeAiUsage` 配额。
2. **API 聚合**：`lib/api/dispatch.ts` 单入口，适配 Vercel 函数数量上限。
3. **浏览器边界**：无完整 LSP、无原生调试器、WebContainer 与 10MB/100 文件等工作区限制（见 `BROWSER_LIMITATIONS` 相关说明）。
4. **插件生产门控**：手动粘贴 JSON 安装仍受 `loadPlugin` 生产策略限制；**官方目录安装**走 `installCatalogEntry` 白名单路径。

---

## 4. 本轮未做 / 刻意延后

| 项 | 原因 |
|----|------|
| P0 生产集成测试全绿 | 依赖 Neon/本地 DB 与部署验收，见 [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) |
| P1 路径 B 真实收款 | 商户/Stripe live 未接，维持路径 A 公测 |
| 协作信令 M1～M3 | 需 WebSocket/SFU 与冲突策略，仍为 Beta |
| Tab 补全延迟优化 | 体验项，未阻塞 RC |
| 后台 Agent / 平台 AI 网关 | 需后端与战略单独立项 |
| VS Code 级扩展生态 | 沙箱 + 目录市场仅为 M3 骨架，非开放市场 |

---

## 5. 文档索引（本轮新增）

| 文档 | 用途 |
|------|------|
| **本文件** | 本轮总结 |
| [PLAN_NEXT_2026.md](./PLAN_NEXT_2026.md) | 下一轮规划（P0' / P1 / P4） |
| [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) | 真正上市差距与门禁 |
| [COMPETITIVE_BENCHMARK_2026.md](./COMPETITIVE_BENCHMARK_2026.md) | vs Cursor、Kiro 等 |
| [ROADMAP.md](./ROADMAP.md) | 阶段索引（已更新 P3 ✅） |

**基线分析**仍以 [PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md) 为准；**历史排期**见 [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)（P0～P3 轨道已完成本轮目标项）。

---

## 6. 建议对外叙事（RC）

- **现在能卖什么**：零安装演示、BYOK 全功能编码、模板与 Agent、可选账号云工作区（部署后）。
- **现在不能承诺什么**：Cursor 级索引与 Tab 补全、稳定多人协作、开放插件商店、平台代付 AI、企业 SSO。
- **下一里程碑**：见 [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) 的「最小可上市（MLP）」与「正式 GA」两档。
