# 当前执行入口

> **更新**：2026-06-07 — **v1.6.0 开发中**（版本号已切 1.6.0）

---

## 策略

- **v1.5.x** ✅ 已全部交付
- **v1.6.0** = 上市就绪 GA（支付生产 · 平台 AI · Tab · 运维）
- **v1.7.0** = marketed 大推（宣传 · 渠道 · 可选应用商店）

---

## 当前：v1.6.0 开发中

**已启动（代码）**：1.6.0 版本号 · 海外 BYOK 兜底 · v16 设置卡 · `v16:preflight` · release gates 820/69

| # | 任务 | 文档 | 状态 |
|:-:|------|------|:----:|
| 1 | 支付宝 **live** + 实付 ¥39 smoke | [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md) | ☐ |
| 2 | Vercel `PLATFORM_DEEPSEEK_API_KEY` | [V1.5_F0_PLATFORM_MODELS.md](./V1.5_F0_PLATFORM_MODELS.md) | ☐ |
| 3 | 海外 MoR：**Lemon Squeezy** 或 BYOK 兜底 | [V1.6_PAYMENT_DECISION.md](./V1.6_PAYMENT_DECISION.md) | ☐ |
| 4 | `BILLING_CRON_SECRET` + expire cron | [V1.6_GA_EXECUTION.md](./V1.6_GA_EXECUTION.md) | ☐ |
| 5 | Tab++ prod `VITE_TAB_PLUS_PLUS=1` | [V1.5_ENV.md](./V1.5_ENV.md) | ☐ |
| 6 | smoke 连续 2 周 5/5 | [V1.5.9_SMOKE_WEEKLY.md](./V1.5.9_SMOKE_WEEKLY.md) | ☐ |

**已完成近期修复**：Neon migrate · 订阅误降级 · 定价 UI · 聊天配额展示 · `db:migrate:deploy` 读 `.env.local`

---

## 门禁

```bash
npm run billing:preflight:production
npm run verify:alipay:prices -- --production
npm run smoke:production -- https://ai-ide-flame.vercel.app
npm run test:local
```

---

## 主文档

| 文档 | 用途 |
|------|------|
| [V1.6_GA_EXECUTION.md](./V1.6_GA_EXECUTION.md) | **周计划 + GA checklist** |
| [ROADMAP_V1.6.md](./ROADMAP_V1.6.md) | F0–F8 总表 |
| [V1.6_KICKOFF.md](./V1.6_KICKOFF.md) | 世代目标 |
| [V1.6_PAYMENT_DECISION.md](./V1.6_PAYMENT_DECISION.md) | Paddle 后支付路线 |
