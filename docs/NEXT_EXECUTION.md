# 当前执行入口

> **更新**：2026-06-06 — **v1.5.7** · 进入 **v1.5.8 E2E/i18n 热修**

---

## 策略

- **v1.5.5** ✅ Stripe Price · `verify:stripe:prices`
- **v1.5.6** ✅ 支付宝 ¥39/¥79 · `verify:alipay:prices`
- **v1.5.7** ✅ Activity Line 默认折叠 · Spec hooks 引导
- **Patch 详表**：[ROADMAP_V1.5.x_PATCHES.md](./ROADMAP_V1.5.x_PATCHES.md)

---

## 当前：v1.5.8（E2E 回归 · i18n · 边缘热修）

| 条件 | 状态 |
|------|:----:|
| 单测 ≥801 | ☐ CI |
| E2E ≥64 | ☐ CI |
| 无 P0 回归 | ☐ |

---

## 门禁

```bash
npm run test:local
npm run verify:alipay:prices
npm run verify:stripe:prices
npm run smoke:production -- https://ai-ide-flame.vercel.app
```
