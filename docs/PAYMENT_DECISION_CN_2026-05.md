# 支付路线决策（已定稿）

> **日期**：2026-05-24  
> **决策**：D3 正式上市 **以国内支付宝 + 微信支付为优先**；Stripe 仅作海外可选，不阻塞 GA。

## 结论

| 项 | 选择 |
|----|------|
| GA 主收款 | 支付宝电脑网站 + 微信 Native |
| 定价（当前代码） | 专业版 ¥19/月 · 团队版 ¥49/月 |
| RC 期 | 维持路径 A（不收款），生产 `billingPath=A` |
| 沙箱目标 | 2026-08 末 M2 |
| 生产商户 GA | 2026-10～11 |

## 不选 / 延后

| 项 | 说明 |
|----|------|
| Stripe 先行 GA | 不采用；无国内商户时也不改为 Stripe-first |
| 仅 dev_mock 上市 | 禁止 |

## 生产 notify URL（部署时填写）

```text
https://ai-ide-flame.vercel.app/api/payment/alipay/notify
https://ai-ide-flame.vercel.app/api/payment/wechat/notify
```

本地沙箱联调：`PAYMENT_NOTIFY_URL` = ngrok 指向 `dev:api`（3001）。

## 执行文档

- 周计划：[PHASE4_CN_PAYMENT.md](./PHASE4_CN_PAYMENT.md)
- 配置：[CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md)
- 商户申请：[CN_MERCHANT_APPLY_CHECKLIST.md](./CN_MERCHANT_APPLY_CHECKLIST.md)
- 长期总览：[PLAN_D3_LONGTERM.md](./PLAN_D3_LONGTERM.md)
