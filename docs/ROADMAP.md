# AI IDE 路线图与文档导航

> **版本基线**：`v1.0.0-rc.1`  
> **最后更新**：2026-05（认证 / 国内支付骨架 / 欢迎页与计费 UI 模块化）  
> 演示站：[https://ai-ide.vercel.app](https://ai-ide.vercel.app)

---

## 文档体系（请先读哪份）

| 文档 | 用途 | 读者 |
|------|------|------|
| **[PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md)** | 既有产品全景分析（架构、功能完成度、SWOT、成熟度） | 全员 / 新成员 onboarding |
| **[OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)** | 下一步拓展与优化规划（P0～P3 轨道、排期、验收） | 产品 / 研发排期 |
| **[IDE_GAP_CHECKLIST.md](./IDE_GAP_CHECKLIST.md)** | 与 Cursor/Kiro 差距清单 + Phase IDE-1/2/3 | 产品 / 研发 |
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

## 二、当前阶段（执行中）

**IDE 能力追赶**（见 [IDE_GAP_CHECKLIST.md](./IDE_GAP_CHECKLIST.md)）：

- **IDE-1**：项目索引、命令面板 `@`、Agent 确认应用
- **IDE-2**：侧栏大纲、F12 跨文件、`.aide/rules`、Chat `@` 补全

对应 [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md) **轨道 P0**：

| 项 | 说明 |
|----|------|
| 集成测试本地绿线 | `npm run db:neon` → `npm run dev:stack` → `npm run test:integration:local` |
| Vercel 生产 | [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) |
| E2E 回归 | UI class 化后跑 `npm run test:e2e` |

**商业化**：商户未接时走 **路径 A（内测不收款）** 或 **路径 B（CN_PAYMENT_SETUP）** — 见优化规划 §4。

---

## 三、阶段索引（历史 + 未来）

| 阶段 | 目标 | 状态 |
|------|------|------|
| **A** 本地与 CI 打绿 | 全栈测试与 CI 一致 | 🔄 执行中（P0） |
| **B** Vercel 生产 | 真实注册 + 云工作区 | ⏳ 待 P0 |
| **C** 产品闭环 | 文档/UI/配额与实现一致 | 大部分 ✅，见分析文档 |
| **D** 商业化就绪 | 国内支付或 Stripe live | ⏳ 待决策（P1） |
| **E** 差异化 | 协作信令 / 插件市场 / AI 网关 | 📋 规划（P3） |

---

## 四、测试矩阵

| 层级 | 命令 | 何时跑 |
|------|------|--------|
| 快速 | `npm run test:local` | 每次改 TS |
| 单元 | `npm run test:unit` | 同上（39 用例） |
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
- [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)

### 其它

- [OBSERVABILITY.md](./OBSERVABILITY.md)
- [storage-migration.md](./storage-migration.md)
