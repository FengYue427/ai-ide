# 支付路线：海外 Stripe 先行（2026-06）

> **日期**：2026-06-01  
> **决策**：暂缓 B 站与国内收款主推；**Stripe 美元订阅** 为 GA 收款方式。  
> **定价**：Pro **$9.99/月** · Team **$19.99/月**（代码常量见 `lib/billing/plans.ts` · v1.5 加权配额调价）。

## 结论

| 项 | 选择 |
|----|------|
| 主收款 | Stripe Checkout + Customer Portal |
| 展示价 | USD（与 Stripe Dashboard Price 一致） |
| 国内支付宝/微信 | 保留代码与 `priceCny`（¥19/¥49），**生产暂不配置** |
| B 站推广 | 暂缓 |

## Stripe Dashboard 必做

1. **Products** → 两个 recurring Price（USD）  
   - Pro：**$9.99 / month**  
   - Team：**$19.99 / month**  
2. 复制 Price ID → `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ENTERPRISE`  
3. Webhook：`https://ai-ide-flame.vercel.app/api/subscription/webhook`  
4. Vercel 环境变量见 [STRIPE_SETUP.md](./STRIPE_SETUP.md)

## 与旧决策关系

[PAYMENT_DECISION_CN_2026-05.md](./PAYMENT_DECISION_CN_2026-05.md) 的「国内优先」在国内网络与商户未就绪前 **暂停执行**；恢复国内收款时仍用 `priceCny` 字段，无需改 Stripe 价。

## 验收

```bash
npm run test:local -- lib/billing/plans.test.ts
npm run verify:stripe:prices   # 配置 STRIPE_* 后校验 Dashboard Price 与 plans.ts
# 配置 STRIPE_* 后
stripe listen --forward-to localhost:3001/api/subscription/webhook
npm run dev:stack
# 登录 → 升级 Pro → 卡号 4242...
```
