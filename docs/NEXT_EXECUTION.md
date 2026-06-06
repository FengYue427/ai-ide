# 当前执行入口

> **更新**：2026-06-06 — **v1.5.5** · 进入 **v1.5.6 支付宝生产**

---

## 策略

- **v1.5.1–1.5.2** ✅ 生产 env · Tab++ 默认 · P95 400ms
- **v1.5.3** ✅ Runtime 抛光
- **v1.5.4** ✅ 平台 AI 体验（欢迎页 · 经济模型配额 · 无 BYOK 困惑）
- **v1.5.5** ✅ Stripe Price 对齐 `plans.ts` · `verify:stripe:prices`
- **Patch 详表**：[ROADMAP_V1.5.x_PATCHES.md](./ROADMAP_V1.5.x_PATCHES.md)

---

## 当前：v1.5.6（支付宝新 Price 生产）

| 条件 | 状态 |
|------|:----:|
| 沙箱 → 生产 Price | ☐ |
| 订阅回调 smoke | ☐ |
| CN billing E2E | ☐ |

---

## 门禁

```bash
npm run test:local
npm run verify:env:v15
npm run verify:stripe:prices   # 需 STRIPE_* 
npm run smoke:production -- https://ai-ide-flame.vercel.app
```
