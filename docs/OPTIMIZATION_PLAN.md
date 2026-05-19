# AI IDE 拓展与优化规划

> 本文档由 [PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md) 推导，定义 **v1.0.0-rc.1 之后** 的迭代方向、优先级与验收标准。  
> 原则：**先让「已写的 RC 能力」在生产可信，再扩展差异化；避免在商户/部署未就绪时堆新功能。**

---

## 1. 规划总目标（2026 Q2 视角）

| 目标 | 描述 | 成功标志 |
|------|------|----------|
| **G1 生产可信** | 公网环境与本地 `dev:stack` 一致 | 陌生人可注册、云存工作区、看到配额 |
| **G2 商业化可选** | 明确「内测免费」或「国内收款」二选一 | 无生产误开 `dev_mock`；支付 QA 通过 |
| **G3 体验债收敛** | UI/测试与 README 对齐 | E2E 绿、核心面板无大块 inline style |
| **G4 差异化储备** | 协作/插件择一加深 | 有清晰「实验/正式」产品文案 |

---

## 2. 战略分轨（四轨并行，优先级自上而下）

```
轨道 P0 ─ 发布与验证     [1～2 周]  G1
轨道 P1 ─ 商业化决策     [1～3 周]  G2  （可与 P0 尾部重叠）
轨道 P2 ─ 体验与质量     [2～4 周]  G3  （与 P0 并行）
轨道 P3 ─ 差异化拓展     [4 周+]    G4
```

---

## 3. 轨道 P0 — 发布与验证（必须完成）

### 3.1 工作包

| ID | 任务 | 产出 | 验收 |
|----|------|------|------|
| P0-1 | 本地全栈测试固定化 | `db:neon` + `dev:stack` 写入团队习惯 | `npm run test:integration:local` 100% 通过 |
| P0-2 | CI 与本地对齐 | 修 Docker/Neon 文档歧义 | `main` 上 integration job 绿 |
| P0-3 | Vercel 生产配置 | 按 [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) | `GET /api/health` → database connected |
| P0-4 | 生产冒烟 | `smoke:production` + 手工清单 | 注册→登录→保存工作区→AI 配额提示 |
| P0-5 | 安全基线 | Production 无 `ALLOW_DEV_BILLING`、`VITE_ALLOW_OFFLINE_AUTH` | `check:skeleton` + 人工查 env |

### 3.2 不在此轨做的事

- 不接真实支付宝/微信（除非 P1 已决策且资源到位）
- 不大改 `SettingsCenter` / Chat UI（留给 P2）
- 不做平台 AI 网关

### 3.3 工时粗估

**3～8 人日**（视 Neon/Vercel 是否已配好）。

---

## 4. 轨道 P1 — 商业化决策与闭环

在 P0 完成后，**产品负责人先选路径**（二选一或分阶段）。

> **2026-05 更新**：代码默认定价已调整为专业版 ¥19 / 团队版 ¥49，配额放宽；支付打通以 [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md) + `npm run billing:preflight` 为准。

### 路径 A：内测期不收款（推荐若暂无商户）

| 任务 | 说明 |
|------|------|
| 生产 UI 文案 | 升级按钮改为「即将开放」或隐藏 checkout |
| 文档 | README/订阅弹窗注明内测 Free |
| 技术 | 保留 `dev_mock` 仅 Preview；Production 仅 `free` 计划 |
| 法务 | 确认无虚假定价展示 |

**验收**：生产用户无法误触真实支付；`payment-methods` 全 false 时体验可理解。

### 路径 B：国内收款上线

| 阶段 | 任务 | 文档 |
|------|------|------|
| B1 沙箱 | 支付宝/微信沙箱 key、notify URL | [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md) |
| B2 联调 | checkout → 支付 → notify → `fulfillOrder` → 订阅更新 | [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md) |
| B3 生产 | 正式商户、HTTPS 回调、关闭 dev_mock | [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) |
| B4 对账 | `admin:lookup` + 订单表巡检脚本（可加强） | |

**验收**：沙箱与生产各完成 1 次 Pro 升级全流程；重复 notify 不重复开通。

### 路径 C：Stripe 海外（可选并行）

- 与路径 B 独立；见 [STRIPE_SETUP.md](./STRIPE_SETUP.md)
- 前端保留「Stripe 账单管理」入口仅当 `payment-methods.stripe`

### 4.1 定价与配额产品化（P1 共用）

| 任务 | 说明 |
|------|------|
| 未登录策略 | 明确：仅提示登录 vs 匿名额度（代码与文案一致） |
| 配额展示 | Chat/设置中展示「今日剩余 / 计划上限」与 429 提示统一 |
| Enterprise | 是否开放自助购买或「联系销售」 |

---

## 5. 轨道 P2 — 体验与质量

### 5.1 UI 样式第二轮（按影响排序）

| 优先级 | 组件/区域 | 动作 | 新建样式 |
|--------|-----------|------|----------|
| P2-U1 | `AuthModal` | 去内联 → class | `auth.css` |
| P2-U2 | `SettingsCenter` | 分块布局 class 化 | `settings.css` |
| P2-U3 | `ChatPanel` | 消息/输入区 token 化 | 扩展 `chat.css` |
| P2-U4 | `WorkspaceManager` | 列表/卡片统一 | 扩展 `workspace.css` |
| P2-U5 | 其余 Modal | 迁移 `ModalShell` | 复用 `ui.css` |

**验收**：上述 4 个区域 `style={{` 减少 80%+；视觉与 `welcome.css` 同一 token 体系。

### 5.2 测试与文档对齐

| ID | 任务 | 验收 |
|----|------|------|
| P2-T1 | 全量 `npm run test:e2e` 修复欢迎页/订阅选择器 | 6 spec 绿 |
| P2-T2 | `test:e2e:stack` 纳入发版前可选门禁 | fullstack 绿 |
| P2-T3 | README「功能特性」与 [PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md) 对齐 | 无夸大未实现项 |
| P2-T4 | 更新 [ROADMAP.md](./ROADMAP.md) 阶段状态 | 与本文一致 |

### 5.3 认证体验补强

| 任务 | 说明 |
|------|------|
| OAuth 生产 | `VITE_ENABLE_OAUTH` + GitHub/Google 回调 |
| 找回密码 | 接 Resend/SMTP（`AUTH_EMAIL_SERVER`） |
| 会话过期 | 前端统一跳转登录 + 保留工作区草稿策略 |

### 5.4 可观测（推荐）

- Sentry DSN（前后端分离或仅前端）
- Vercel Analytics
- 见 [OBSERVABILITY.md](./OBSERVABILITY.md)

**工时粗估**：**8～15 人日**（视 Settings/Chat 拆分难度）。

---

## 6. 轨道 P3 — 差异化拓展（中长期）

在 **G1～G3 至少达成两项** 后再主力投入。

### 6.1 协作（若选为差异化）

| 里程碑 | 内容 |
|--------|------|
| M1 | 信令服务（WebSocket/SFU 选型文档） |
| M2 | 冲突策略与「谁在线」稳定展示 |
| M3 | 与 `useCollaborationSync` 文件树一致性质检 |
| M4 | 设置页文案：「实验功能」→「Beta」分级 |

### 6.2 插件（若选为差异化）

| 里程碑 | 内容 |
|--------|------|
| M1 | 权限矩阵与沙箱审计 |
| M2 | 签名/来源校验 |
| M3 | 内置市场 UI（只读列表 → 安装） |

### 6.3 平台 AI 网关（仅当战略明确）

- **新服务**：代理推理 + 密钥托管 + 与 `UsageRecord` 统一计费
- **影响**：颠覆当前 BYOK 架构，需独立 PRD，**不纳入 RC 小步迭代**

---

## 7. 迭代排期建议（12 周滚动）

| 周次 | 焦点 | 交付物 |
|------|------|--------|
| W1 | P0 | 集成测试绿 + Vercel 部署 + 冒烟报告 |
| W2 | P0 收尾 + P1 决策 | 商业化路径 A 或 B 书面确认 |
| W3～W4 | P1 执行 | 内测文案 **或** 沙箱支付打通 |
| W3～W6 | P2 并行 | auth/settings CSS + E2E 绿 |
| W7～W8 | P2 收尾 | OAuth/邮件可选 + Sentry |
| W9～W12 | P3 | 协作 **或** 插件选一个 M1～M2 |

---

## 8. 优先级矩阵（RICE 简化版）

|  initiative | Reach | Impact | Confidence | Effort | 建议 |
|-------------|-------|--------|------------|--------|------|
| P0 生产部署 | 高 | 高 | 高 | 低 | **立即** |
| P1 内测不收款文案 | 高 | 中 | 高 | 低 | **立即**（若暂不收款） |
| P1 国内支付沙箱 | 中 | 高 | 中 | 中 | 商户就绪后 |
| P2 Auth/Settings UI | 高 | 中 | 高 | 中 | P0 后并行 |
| P2 E2E 回归 | 中 | 高 | 高 | 低 | UI 改动后 |
| P3 协作信令 | 低 | 高 | 低 | 高 | 战略选定后 |
| P3 AI 网关 | 低 | 极高 | 低 | 极高 | 单独立项 |

---

## 9. 验收清单（发版 Gate）

发 **v1.0.0** 或 **v1.0.0-rc.2** 前建议全部勾选：

- [ ] `npm run test:local` 通过
- [ ] `npm test` 构建通过
- [ ] `npm run test:integration:local` 通过（或有 CI 绿证明）
- [ ] `npm run test:e2e` 通过（或记录已知 skip 与 issue）
- [ ] 生产 `/api/health` 正常
- [ ] 生产注册/登录/云工作区手工 QA
- [ ] 商业化路径文档与 UI 一致（A 或 B）
- [ ] [PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md) 与实现无矛盾项已修正

---

## 10. 与 ROADMAP 的关系

- [ROADMAP.md](./ROADMAP.md)：保留**阶段索引、文档导航、测试矩阵**（轻量）。
- 本文：**可执行任务、优先级、验收**（重量）。
- [PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md)：**现状事实基线**（分析）。

三者冲突时，以 **PRODUCT_ANALYSIS（事实）→ OPTIMIZATION_PLAN（计划）→ ROADMAP（索引）** 为准，并回写 ROADMAP 勾选状态。

---

## 11. 下一 Sprint 建议（可直接开工的 5 项）

若团队只有 **1 个迭代（~1 周）**，建议只做：

1. `npm run test:integration:local` 打绿并记入 CI 徽章说明  
2. 按 [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) 完成 Vercel + Neon 生产  
3. 手工 QA：注册 / 云工作区 / 配额 429（截图存档）  
4. 商业化路径 **A 或 B** 书面决策 + 改订阅弹窗一句文案  
5. `npm run test:e2e`，修欢迎页/导航失败用例  

完成后再从 **P2-U1（AuthModal CSS）** 起做体验债。
