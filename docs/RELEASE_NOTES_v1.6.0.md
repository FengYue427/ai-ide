# Release Notes — v1.6.0 · 上市就绪 GA

> **状态**：开发中  
> **规划**：[V1.6_GA_EXECUTION.md](./V1.6_GA_EXECUTION.md)

---

## 定位

v1.6.0 是 **上市前最后一个大版本**：国内支付宝 live、平台 AI 生产、订阅可信、体验抛光。

---

## Added（开发中）

- **v1.6 脚手架**：`v16Features` · `v16ProductionEnv` · `SettingsV16FeaturesCard`
- **海外兜底（Plan B）**：无 MoR 时订阅弹窗展示「海外即将开放」· Free+BYOK
- **运维**：`npm run v16:preflight` · `verify:env:v16` · `db:migrate:deploy` 读 `.env.local`
- **Release gates**：unit ≥820 · E2E ≥70

---

## P0 运维（发版前必绿）

- [ ] 支付宝 live 实付 smoke
- [ ] `PLATFORM_DEEPSEEK_API_KEY` on Vercel
- [ ] `BILLING_CRON_SECRET` + expire cron
- [ ] smoke 5/5 · tag `v1.6.0`

---

## 已知限制

- Paddle Vendor **拒审** — 海外 Pro/Team 延至 v1.6.1（Lemon Squeezy 候选）
- 宣传/marketed 大推 → **v1.7**
