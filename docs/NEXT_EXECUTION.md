# 当前执行清单（2026-05-24）

> **长期战略**：[PLAN_D3_LONGTERM.md](./PLAN_D3_LONGTERM.md) — **正式上市 = D3 可收款 GA**（约 2026-10～11）  
> **现在**：RC 公测（路径 A）+ Phase 3 启动  
> **RC 公告**：[RC_ANNOUNCEMENT_2026-05.md](./RC_ANNOUNCEMENT_2026-05.md)

---

## 战略一句话

| 阶段 | 对外 |
|------|------|
| 现在～GA 前 | RC 公测，**不收款** |
| **GA（D3）** | 正式版，**可订阅** |

---

## Phase 2 — ✅ 已闭环

见 [PHASE2_STATUS.md](./PHASE2_STATUS.md) · smoke 5/5 · 法务 RC · D2 达标

---

## Phase 3 — 当前冲刺（～10 周）

| 周 | 任务 | 状态 |
|----|------|------|
| W1～W2 | P4-1 续：分片 + embedding 设计/实现 | ⬜ 下一步 |
| W3～W5 | P4-1 UI + 增量索引 | ⬜ |
| W6 | P4-4 Tab 补全 | ⬜ |

详见 [PHASE3_KICKOFF.md](./PHASE3_KICKOFF.md)、[P4-1_INDEXING.md](./P4-1_INDEXING.md)。

---

## Phase 4 — 支付（与 Phase 3 并行，6 月起）

| 任务 | 状态 |
|------|------|
| 2026-06-30 商户路线决策（国内 / Stripe / 双轨） | ⬜ |
| 支付宝+微信沙箱 E2E | ⬜ |
| 取消/到期/退款 MVP | ⬜ |
| 生产商户 + `check:release:billing` | ⬜ |

详见 [PLAN_D3_LONGTERM.md](./PLAN_D3_LONGTERM.md) §4.2、[CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md)。

---

## 生产复检

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run smoke:report
```

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [PLAN_D3_LONGTERM.md](./PLAN_D3_LONGTERM.md) | **长期规划（主文档）** |
| [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) | D0～D4 门禁 |
| [LEGAL_RC_2026-05.md](./LEGAL_RC_2026-05.md) | RC 法务（GA 前需 D3 增补） |
