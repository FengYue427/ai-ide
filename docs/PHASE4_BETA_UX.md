# Phase 4 — 公测体验与发布收尾

> 接续 Phase 0～3（安全 / 限流 / 插件沙箱 / 可观测）。  
> 对应 [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md) 轨道 **P1 路径 A** + **P2 认证体验** 子集。

## 已完成

| 项 | 说明 |
|----|------|
| 路径 A 计费 UX | `lib/billing/checkout.ts`：`hasCheckoutPayment`、`BETA_BILLING_NOTE` |
| 订阅弹窗 | 未接支付时显示公测横幅；付费按钮文案「公测免费」 |
| 工具栏 | 未登录也可点「查看套餐」；已登录仍为「升级套餐 ¥19起」 |
| 会话过期 | `apiFetch` 遇 401（除 session/signin）→ `authService.handleSessionExpired` → 登录弹窗 |
| E2E | `e2e/helpers.ts` + CI `vite preview`；计费用例覆盖访客「查看套餐」 |

## 验证

```bash
npm run test:unit
npm run build
# 本地 CI 模式 E2E
set CI=true   # Windows
npm run test:e2e
```

## 下一步（Phase 5 / P0）

1. `npm run deploy:check` 对生产域名冒烟  
2. `npm run test:integration:local` 全绿  
3. 路径 B：接支付宝/微信沙箱（见 [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md)）  
4. P2-U2：`SettingsCenter` 样式 class 化（可选）
