# 当前执行清单（2026-05-24）

> **长期**：[PLAN_D3_LONGTERM.md](./PLAN_D3_LONGTERM.md) · **支付（国内优先）**：[PHASE4_CN_PAYMENT.md](./PHASE4_CN_PAYMENT.md)

---

## 已定：国内支付宝 + 微信 → D3 GA

见 [PAYMENT_DECISION_CN_2026-05.md](./PAYMENT_DECISION_CN_2026-05.md)

---

## 本周（W1 支付准备 + Phase 3 启动）

| # | 任务 | 状态 |
|---|------|------|
| 1 | 支付宝开放平台：沙箱 AppID + 密钥 | ⬜ 你 |
| 2 | `npm run billing:preflight` | ⬜ |
| 3 | `npm run payment:notify-urls` | ⬜ |
| 4 | `.env.local` 沙箱 → `dev:stack` → 订阅页见支付宝按钮 | ⬜ |
| 5 | P4-1 续包：分片/embedding 设计 | ⬜ 研发 |

**生产 Vercel**：保持路径 A（**不要**填支付宝/微信生产密钥，直到 B3）。

---

## Phase 4 下一里程碑（W3～W5）

支付宝沙箱：**付款 → notify → Pro 订阅** — 见 [PHASE4_CN_PAYMENT.md](./PHASE4_CN_PAYMENT.md) §W3～W5

---

## Phase 2 — ✅

[PHASE2_STATUS.md](./PHASE2_STATUS.md)

---

## 命令

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run billing:preflight
npm run payment:notify-urls
npm run dev:stack
npm run smoke:report
```

---

## 文档

| 文档 | 用途 |
|------|------|
| [CN_MERCHANT_APPLY_CHECKLIST.md](./CN_MERCHANT_APPLY_CHECKLIST.md) | 商户开通 |
| [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md) | env 与联调 |
| [PHASE3_KICKOFF.md](./PHASE3_KICKOFF.md) | 索引续包 |
