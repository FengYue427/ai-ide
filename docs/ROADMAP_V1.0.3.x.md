# 1.0.3.x 附属路线图（1.0.3.1 → 1.0.3.4）— GA 后 stabilization

> **前置**：必须先完成主版本 **[v1.0.3 GA](V1.0.3_KICKOFF.md)**（Phase 3 tag `v1.0.3`）  
> **版本策略**：第四段补丁位与 [VERSIONING.md](./VERSIONING.md) 一致：`1.0.3.N` = **1.0.3 GA 基础上的第 N 个小包**，**不搞功能大爆炸**。  
> **主规划**：[V1.0.3_MASTER_PLAN.md](./V1.0.3_MASTER_PLAN.md) · **Kickoff**：[V1.0.3_KICKOFF.md](./V1.0.3_KICKOFF.md)  
> **下一世代**：四层收官后 → **v1.1 RFC**（Background Agent / 协作 M1 等见 Master Plan §6）

---

## 0. 为何要有 1.0.3.x

| 原因 | 说明 |
|------|------|
| **GA ≠ 一劳永逸** | 观测、域名、Cron、法务文案常在 GA 之后才「收口」 |
| **与 1.0.2.x 区分** | 1.0.2.x 承技术债（Diff/FIM/索引）；**1.0.3.x 只做运营稳定 + 低风险修补** |
| **不打 v1.0.4 主版本** | 竞品分锚定 **~2.75**（[COMPETITOR_COMPARISON_V1.0.2.md](./COMPETITOR_COMPARISON_V1.0.2.md)），除非出现契约级破坏性变更 |

---

## 1. 四级总览（1.0.3.1 ～ 1.0.3.4）

| 版本 | 代号 | 状态 | 主题（一句话） | 建议节奏 |
|:----:|------|:----:|----------------|----------|
| **1.0.3** | — | 🔶 RC→GA | 稳定版对外 tag、双平台 Release | Master Plan |
| **1.0.3.1** | **S1 观测** | ⏳ 规划 | Sentry / Cron / 生产 health 与版本号对齐 | GA 后 **~1 周** |
| **1.0.3.2** | **S2 域名** | ⏳ 规划 | 自定义域 + `APP_URL` 全链路 + 403/COOP 回归 | **~1～2 周** |
| **1.0.3.3** | **S3 计费** | ⏳ 规划 | `billing:verify-cron`、对账/宽限期边缘案例、支付页勘误 | **~1～2 周** |
| **1.0.3.4** | **S4 收官** | ⏳ 规划 | 发布矩阵、竞品 live 再测入档、关闭 1.0.3.x milestone | **~1 周** |

> **Git tag**：推荐 `v1.0.3.1` … `v1.0.3.4`（与 `package.json` 同步）；Web 与桌面同 tag 发 Release（若有桌面差分再单开 issue）。

---

## 2. 1.0.3.1 — S1 观测与门禁

| ID | 交付 | 验收 |
|----|------|------|
| 3.1-1 | Vercel 填 `VITE_SENTRY_DSN`；Sentry release = `ai-ide@1.0.3.1` | 生产能收到至少 1 条试投事件（staging 或沙箱） |
| 3.1-2 | `CRON_SECRET` 就绪；`billing:verify-cron` / 相关 Cron 按 [V1.0.3_PHASE1_OPS.md](./V1.0.3_PHASE1_OPS.md) 跑通 | `ops:verify-p1` 无新增红项 |
| 3.1-3 | `/api/health` 的 `version` 与 `package.json` **一致** | `curl` 记录进 [PRODUCTION_SMOKE_LAST.md](./PRODUCTION_SMOKE_LAST.md) 或运维笔记 |
| 3.1-4 | `npm run go-live:preflight` 每附属发版前必跑 | CI + 本地全绿 |

**非目标**：新 Agent 工具、Tab 模型、索引上限变更。

---

## 3. 1.0.3.2 — S2 域名与信任

| ID | 交付 | 验收 |
|----|------|------|
| 3.2-1 | 自定义域（若采用）与 Vercel 证书、`APP_URL` 一致 | [CUSTOM_DOMAIN.md](./CUSTOM_DOMAIN.md) checklist 全勾 |
| 3.2-2 | OAuth / 支付回跳 / 邮件内链使用统一 `APP_URL` | 沙箱下单 + 登录各 1 条成功路径 |
| 3.2-3 | COOP/COEP、WebContainer、登录 Cookie 域 **回归** | 手工或 E2E 抽跑 |
| 3.2-4 | [BROWSER_LIMITATIONS.md](./BROWSER_LIMITATIONS.md) / 欢迎页「当前访问地址」与生产一致 | 文档 PR |

---

## 4. 1.0.3.3 — S3 计费与对账

| ID | 交付 | 验收 |
|----|------|------|
| 3.3-1 | 支付宝 Path B 生产 **周度**对账或脚本槽位（见 [BILLING_RECONCILE_DAILY.md](./BILLING_RECONCILE_DAILY.md)） | 运维 SOP 有执行记录 |
| 3.3-2 | 宽限期 / 到期降级 / 429 配额 — 边缘案例有 **FAQ 或 runbook** 一条 | [BILLING_SUBSCRIPTION_LIFECYCLE.md](./BILLING_SUBSCRIPTION_LIFECYCLE.md) 链出 |
| 3.3-3 | `public/legal/payment*.html` 主体、价格行与生产套餐 **一致** | 人工 diff |
| 3.3-4 | 微信 live **仍不接**（决策已记录）— 仅检查文案无误导 | [decisions/WECHAT_PAY_v1.0.3.md](./decisions/WECHAT_PAY_v1.0.3.md) |

---

## 5. 1.0.3.4 — S4 沟通与 milestone 收官

| ID | 交付 | 验收 |
|----|------|------|
| 3.4-1 | [publish/](./publish/) 矩阵升版至 **1.0.3.x** 最终表述（CSDN/掘金等择要） | 至少 2 渠道可发 |
| 3.4-2 | 再跑一轮 `rc:live-spotcheck` 或子等集，结果写入 **`RC_LIVE_SPOTCHECK_LAST.md` 附录**（日期 + 版本） | 负责人勾选或 issue |
| 3.4-3 | README / ROADMAP 顶栏：**当前稳定版** 文案与收口版本一致 | PR |
| 3.4-4 | GitHub **关闭** `1.0.3.x` milestone；开 **v1.1** 讨论帖或 RFC stub | Discussion / `docs/` 占位 |

---

## 6. 全局非目标（1.0.3.x 整段不适用）

Background Agent · Cascade 级全感知 · Kiro Hooks · VSIX · 全语言 DAP · 索引/工具数量大规模扩张 — 一律 **v1.1+**。

---

## 7. CHANGELOG / 发包习惯

- 每一附属：`CHANGELOG.md` 增加 `[1.0.3.N]` 一节（即使仅有运维与文档）。
- `package.json` `version` 与 `VITE_APP_VERSION`（若使用）对齐。
- 桌面：`desktop-release.yml` 随 tag 触发；macOS unsigned 仍以 [decisions/MACOS_SIGNING_v1.0.3.md](./decisions/MACOS_SIGNING_v1.0.3.md) 为准。

---

## 8. 快速命令

```powershell
npm run test:local
npm run go-live:preflight
npm run ops:verify-p1
# 可选
npm run rc:live-spotcheck
```

---

## 9. 文档索引

| 文档 | 用途 |
|------|------|
| [NEXT_EXECUTION.md](./NEXT_EXECUTION.md) | 当前周执行（含 GA 与 1.0.3.x 指针） |
| [V1.0.3_RC.md](./V1.0.3_RC.md) | RC 验收 |
| [GA_POST_LAUNCH_72H.md](./GA_POST_LAUNCH_72H.md) | 上线后观测 |
| [ROADMAP_V1.0.3-V1.0.9.md](./ROADMAP_V1.0.3-V1.0.9.md) | 与中长线并排阅读；**1.0.3 GA 之后的第四段收口以本文为准** |
