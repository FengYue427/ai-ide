# AI IDE 路线图与文档导航

> **版本基线**：**v1.0.4**（块级 Diff）· [PHASE_IDE5_DIFF.md](./PHASE_IDE5_DIFF.md)  
> **大总结**：[V1.0.2_STATUS_SUMMARY.md](./V1.0.2_STATUS_SUMMARY.md) · **竞品**：[COMPETITOR_COMPARISON_V1.0.2.md](./COMPETITOR_COMPARISON_V1.0.2.md) · **路线图**：[ROADMAP_V1.0.3-V1.0.9.md](./ROADMAP_V1.0.3-V1.0.9.md)  
> 演示站：[https://ai-ide.vercel.app](https://ai-ide.vercel.app)

---

## 文档体系（请先读哪份）

| 文档 | 用途 | 读者 |
|------|------|------|
| **[PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md)** | 既有产品全景分析（架构、功能完成度、SWOT、成熟度） | 全员 / 新成员 onboarding |
| **[OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)** | 下一步拓展与优化规划（P0～P3 轨道、排期、验收） | 产品 / 研发排期 |
| **[IDE_GAP_CHECKLIST.md](./IDE_GAP_CHECKLIST.md)** | 与 Cursor/Kiro 差距清单 + Phase IDE-1/2/3 | 产品 / 研发 |
| **[PHASE_IDE4_CURSOR_PARITY.md](./PHASE_IDE4_CURSOR_PARITY.md)** | **IDE-4 细致规划**：本地盘 + Tool Agent + Electron | 产品 / 研发 |
| **[PRODUCT_SUMMARY_2026-05.md](./PRODUCT_SUMMARY_2026-05.md)** | 本轮迭代总结（P0～P3） | 全员 |
| **[PLAN_NEXT_2026.md](./PLAN_NEXT_2026.md)** | 下一轮规划（P0' / P1 / P4） | 产品 / 研发 |
| **[LAUNCH_READINESS.md](./LAUNCH_READINESS.md)** | 真正上市（GA）门禁与 blocker | 产品 / 运维 |
| **[COMPETITIVE_BENCHMARK_2026.md](./COMPETITIVE_BENCHMARK_2026.md)** | vs Cursor、Kiro 等竞品评分 | 产品 / 市场 |
| **[COMPETITOR_COMPARISON_V1.0.2.md](./COMPETITOR_COMPARISON_V1.0.2.md)** | 四竞品逐项真对比（当前） | 产品 / 市场 |
| **[ROADMAP_V1.0.3-V1.0.9.md](./ROADMAP_V1.0.3-V1.0.9.md)** | 七个补丁版具体交付 | 研发排期 |
| **本文件 ROADMAP.md** | 阶段索引、测试矩阵、文档导航 | 快速查阅 |

**冲突处理**：事实以 `PRODUCT_ANALYSIS` 为准；执行以 `OPTIMIZATION_PLAN` 为准。

---

## 一、已完成（RC 骨架）

| 阶段 | 内容 | 验证 |
|------|------|------|
| **S1** | Vite、CI、`npm test`、`.env.example` | `npm test` |
| **S2** | `AppShell` / `ideStore`、样式模块化 | `npm run test:local` |
| **S2b** | `tokens` / `ui` / `welcome` / `billing` CSS，`ModalShell` | 欢迎页 + 计费弹窗 |
| **S3** | Prisma、`/api/auth/*`、`/api/workspaces/*`、JWT Cookie | `test:integration:local` |
| **S4** | 邮箱认证、限流、OAuth 路由、找回密码骨架 | [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md) |
| **S5** | 订阅 CRUD、CNY 套餐、支付宝/微信 + Stripe 骨架、`PaymentOrder` | [BILLING_SKELETON.md](./BILLING_SKELETON.md) |
| **L1** | 内联补全、Agent、插件沙箱示例 | 单元测试 + 手动 |
| **L2** | `consumeAiUsage` + 429、配额闭环 | 集成测试 |
| **L3** | 工作区云端 UI、`allowOfflineAuthFallback` 生产策略 | E2E + 集成 |
| **L4** | `/api/health`、观测钩子、法务模板页、admin 脚本 | [OBSERVABILITY.md](./OBSERVABILITY.md) |

---

## 二、当前阶段

**Phase 2 RC**（2026-05）✅。**正式上市** → **D3 GA**（约 2026-10～11）：[PLAN_D3_LONGTERM.md](./PLAN_D3_LONGTERM.md)。**当前**：[NEXT_EXECUTION.md](./NEXT_EXECUTION.md) Phase 3 + Phase 4 并行。

**Phase 4 交付清单**：

| 项 | 说明 | 状态 |
|----|------|------|
| E2E UI | `vite preview` + `e2e/helpers` 预填工作区 | ✅ |
| 路径 A 计费 UX | 未接支付时公测横幅 +「查看套餐」+ 按钮「公测免费」 | ✅ |
| 会话过期 | `apiFetch` 401 → 清会话 + 登录弹窗 | ✅ |
| P0' 集成测试 + 安全基线 | `npm run p0:gate` | 🔶 Neon HTTP 无事务修复后复验 |
| P0 生产冒烟 | [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) | 🔶 `APP_URL` + deploy:check |
| i18n Phase 1 | [I18N_STATUS.md](./I18N_STATUS.md) + [I18N_SMOKE_CHECKLIST.md](./I18N_SMOKE_CHECKLIST.md) | ✅ |
| P1 路径 A 公测计费 | `billingPath` + 公测文案 | ✅ |
| P1 路径 B 骨架 | checkout / notify / dev simulate | ✅ 代码 |
| P2 样式债（Settings/Chat） | `settings.css` + `QuotaIndicator` + `chat.css` 扩展 | ✅ |
| P2 样式债（Workspace） | `workspace-manager.css` 迁移 | ✅ |
| P2 Modal 统一 | 主要 Modal → `ModalShell` + `modals.css` | ✅ |
| P3 Chat @ 上下文 | `mentionContextService` 注入 system prompt | ✅ |
| P3 协作 Beta | `CollaborationPanel` 说明 + 设置页 Beta 标签 | ✅ |
| P3 插件市场 M3 | `pluginCatalogService` + `PluginManager` 市场 Tab | ✅ |

**IDE 能力**（IDE-1/2/3 基础已完成；**下一阶段** → [PHASE_IDE4_CURSOR_PARITY.md](./PHASE_IDE4_CURSOR_PARITY.md)）。

**商业化**：商户未接时默认 **路径 A（内测不收款）**；接商户后走 **路径 B** — [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md)。

---

## 三、阶段索引（历史 + 未来）

| 阶段 | 目标 | 状态 |
|------|------|------|
| **A** 本地与 CI 打绿 | 全栈测试与 CI 一致 | 🔄 E2E UI ✅；integration 待绿 |
| **B** Vercel 生产 | 真实注册 + 云工作区 | ⏳ 待 P0 |
| **C** 产品闭环 | 文档/UI/配额与实现一致 | 大部分 ✅，见分析文档 |
| **D** 商业化就绪 | 国内支付或 Stripe live | ⏳ 待决策（P1） |
| **E** 差异化 | 协作信令 / 插件市场 / AI 网关 | 🔶 P3 骨架 ✅；信令/网关见 P4 |

---

## 四、测试矩阵

| 层级 | 命令 | 何时跑 |
|------|------|--------|
| 快速 | `npm run test:local` | 每次改 TS |
| 单元 | `npm run test:unit` | 同上（109 用例） |
| P0' 门禁 | `npm run p0:gate` | 单测 + 集成 + security-baseline |
| 构建 | `npm test` | PR / 合并前 |
| API 全量 | `npm run test:integration:local` | DB 可用、发版前 |
| 骨架 | `npm run check:skeleton` | 计费/路由变更后 |
| E2E UI | `npm run test:e2e` | UI 大改后 |
| E2E 全栈 | `npm run test:e2e:stack` | 发版前可选 |
| 冒烟 | `npm run test:smoke` / `smoke:production` | 构建后 / 部署后 |

---

## 五、上线类型与最少工作

| 上线目标 | 最少完成 | 参考 |
|----------|----------|------|
| 演示站 + BYOK | 无额外工作 | 已具备 |
| **账号 + 云工作区** | P0 + B | OPTIMIZATION_PLAN §3 |
| **可收订阅费（国内）** | 以上 + P1 路径 B | [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md) |
| **可收订阅费（Stripe）** | 以上 + Stripe live | [STRIPE_SETUP.md](./STRIPE_SETUP.md) |
| 平台级 AI 产品 | P3 网关单独立项 | PRODUCT_ANALYSIS §6.4 |

---

## 六、相关文档

### 开发与部署

- [LOCAL_DEV.md](./LOCAL_DEV.md)
- [NEON_SETUP.md](./NEON_SETUP.md)
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
- [VERCEL_SETUP.md](./VERCEL_SETUP.md)

### 认证与计费

- [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- [BILLING_SKELETON.md](./BILLING_SKELETON.md)
- [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md)
- [STRIPE_SETUP.md](./STRIPE_SETUP.md)
- [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md)

### 产品与规划

- [PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md)
- [PRODUCT_SUMMARY_2026-05.md](./PRODUCT_SUMMARY_2026-05.md)
- [PLAN_NEXT_2026.md](./PLAN_NEXT_2026.md)
- [LAUNCH_READINESS.md](./LAUNCH_READINESS.md)
- [COMPETITIVE_BENCHMARK_2026.md](./COMPETITIVE_BENCHMARK_2026.md)
- [P0_P1_STATUS.md](./P0_P1_STATUS.md)
- [NEXT_EXECUTION.md](./NEXT_EXECUTION.md)
- [LAUNCH_ASSESSMENT_2026-05.md](./LAUNCH_ASSESSMENT_2026-05.md)
- [I18N_STATUS.md](./I18N_STATUS.md)
- [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)

### 其它

- [OBSERVABILITY.md](./OBSERVABILITY.md)
- [storage-migration.md](./storage-migration.md)
