# AI IDE 下一轮规划（2026 Q2～Q3）

> 承接 [PRODUCT_SUMMARY_2026-05.md](./PRODUCT_SUMMARY_2026-05.md) · P3 已闭环后的执行建议。  
> 与 [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md) 关系：原 P0～P3 轨道中**未完成项**下沉为本文件的 **P0' / P1 / P4**。

---

## 1. 战略选择（必须先定）

在启动 P4 前，产品负责人确认 **主赛道**（二选一为主，另一为辅）：

| 赛道 | 用户价值 | 典型交付 |
|------|----------|----------|
| **A. 可上市 SaaS** | 注册即用、云工作区稳定、可收款 | P0' 部署门禁 + P1 支付 + 法务/观测 |
| **B. 浏览器差异化 IDE** | 轻量、开源、BYOK、插件与协作 | P4 索引/LSP 代理、协作信令、插件 M2 签名 |

**建议**：RC 阶段默认 **A 优先 4～6 周**，B 中与上市无关的项（如 AI 网关）继续搁置。

---

## 2. 轨道 P0' — 上市门禁（2～3 周）

> 对应 [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) MLP 档。

| ID | 任务 | 验收 |
|----|------|------|
| P0'-1 | `test:integration:local` 全绿（Neon 或 Docker） | CI + 本地同一命令绿 |
| P0'-2 | `npm run deploy:check` / `smoke:production` 对生产 URL 绿 | health + auth 探活 |
| P0'-3 | E2E 纳入 PR 必跑或 nightly | `test:e2e` 在 CI 稳定 |
| P0'-4 | 生产 `APP_URL`、Cookie `Secure`、CORS 与 OAuth 回调一致 | 注册登录闭环人工 30min |
| P0'-5 | 错误页与降级：`allowOfflineAuthFallback` 生产策略文档化 | DEPLOY_CHECKLIST 勾选 |
| P0'-6 | 安全扫一遍：密钥不进仓库、rate limit、admin 路由保护 | 清单签字 |

**工时**：约 **10～15 人日**（含环境问题排查）。

---

## 3. 轨道 P1 — 商业化（2～4 周，依赖商户）

| 路径 | 条件 | 交付 |
|------|------|------|
| **A（维持）** | 暂不收款 | 公测文案、配额透明、Pro 功能灰显 — **已基本完成** |
| **B（收款）** | 支付宝/微信沙箱或 Stripe test | checkout 端到端 + webhook + `PaymentOrder` 状态机 |
| **B+** | 生产商户 | [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md) / [STRIPE_SETUP.md](./STRIPE_SETUP.md) 生产勾选 |

**决策点**：若 6 周内无商户，对外仍称 **公测 / RC**，不宣传「可订阅」。

---

## 4. 轨道 P4 — 产品深度（8～12 周，A 稳定后并行）

按 **RICE** 排序的建议顺序：

| 优先级 |  initiative | 说明 | 工时粗估 |
|--------|-------------|------|----------|
| P4-1 | **代码库理解** | 向量检索生产化、大仓分片、`.gitignore` 统一 | 15～25 人日 |
| P4-2 | **语言服务** | TS/JS 深化或轻量 LSP 代理（wasm/Worker） | 20～40 人日 |
| P4-3 | **Git / 调试** | status 面板完善；调试「说明限制」或 Chrome 协议桥 | 10～20 人日 |
| P4-4 | **Tab 补全** | 降延迟、防抖、缓存 | 5～8 人日 |
| P4-5 | **协作 Beta→GA** | 信令 M1、在线列表 M2、冲突策略 M3 | 25～40 人日 |
| P4-6 | **插件 M2** | 包签名、来源校验、市场远程清单（CDN/GitHub Releases） | 15～20 人日 |
| P4-7 | **桌面壳（可选）** | Electron 评估 → POC | 20+ 人日 |

**明确不做（除非新 PRD）**：平台 AI 网关、后台长时 Agent 队列。

---

## 5. 12 周滚动排期（建议）

| 周 | 焦点 | 里程碑 |
|----|------|--------|
| W1～W2 | P0' | 集成测试绿 + 生产冒烟报告 |
| W3 | P1 决策 | 路径 A/B 书面确认 + 商户时间表 |
| W4～W6 | P1 或 P0' 加固 | 支付沙箱 **或** OAuth/邮件生产 |
| W7～W8 | P4-1 启动 | 索引/检索 MVP 可用 |
| W9～W10 | P4-4 + 文档 | Tab 补全 + 上市文案更新 |
| W11～W12 | P4-5 或 P4-6 | 协作 M1 **或** 插件远程目录 |

---

## 6. 验收标准（下一轮结束）

1. **MLP 上市**：满足 [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) §2 全部必选项。
2. **指标**：生产 7 天内注册→建工作区→AI 对话成功率 > 95%（人工抽样 20 用户）。
3. **竞品**：综合分从 ~1.8 提升到 **≥ 2.2**（见 [COMPETITIVE_BENCHMARK_2026.md](./COMPETITIVE_BENCHMARK_2026.md) 评分表）。
4. **文档**：`PRODUCT_ANALYSIS` 与 `IDE_GAP_CHECKLIST` 同步更新评分。

---

## 7. 风险与依赖

| 风险 | 缓解 |
|------|------|
| Vercel 冷启动 + DB 连接 | Neon pooler、health 预热 |
| 浏览器存储限额 | 云工作区为主路径宣传 |
| 插件安全事件 | 市场仅官方目录 + M2 签名后再开放第三方 |
| 与 Cursor 正面竞争 | 定位「开源浏览器 + BYOK + 国内支付」，不拼桌面 LSP |
