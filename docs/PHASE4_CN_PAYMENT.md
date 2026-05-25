# Phase 4 — 国内支付（支付宝 + 微信优先）

> **决策**：[PAYMENT_DECISION_CN_2026-05.md](./PAYMENT_DECISION_CN_2026-05.md)  
> **与 Phase 3 并行**：索引续包不阻塞本轨道。

## 目标

| 里程碑 | 日期（参考） | 标准 |
|--------|--------------|------|
| **B0** | 2026-06-07 | 商户申请已提交（支付宝沙箱可用） |
| **B1** | 2026-08-31 | 沙箱：付款 → notify → 订阅 Pro + 订单 paid |
| **B2** | 2026-09-20 | 取消订阅、到期降级、退款流程（至少人工 SOP） |
| **B3** | GA 前 | 生产商户 + 7 天无 P0 支付事故 |

---

## 周计划

### W1～W2（2026-05-25 ～ 06-07）— 准备

| # | 任务 | 负责人 | 完成标准 |
|---|------|--------|----------|
| 1 | 填写 [CN_MERCHANT_APPLY_CHECKLIST.md](./CN_MERCHANT_APPLY_CHECKLIST.md) | 运营/你 | 支付宝沙箱 AppID 到手 |
| 2 | `.env.local` 沙箱密钥 | 研发 | `npm run billing:preflight` 支付宝 ✅ |
| 3 | ngrok 固定域名（可选） | 研发 | `PAYMENT_NOTIFY_URL` 文档化 |
| 4 | 生产 Vercel **仍路径 A** | — | 勿误开商户 env |

### W3～W5 — 支付宝沙箱 E2E

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | `dev:stack` + 登录 | `GET /api/subscription/payment-methods` → `alipay:true` |
| 2 | 订阅 → 专业版 → 支付宝 | 跳转沙箱收银台 |
| 3 | 付款成功回跳 | `/?subscription=success&plan=pro` |
| 4 | notify 到账 | 订单 `paid`；订阅 `pro`；配额变 5000/日 |
| 5 | 扩展集成测或手工记录 | [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md) 增「支付」节 |

### W6～W7 — 微信沙箱 E2E

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | 微信沙箱/测试商户 env | preflight 微信 ✅ |
| 2 | Native 扫码支付 | `CnPayModal` 出码；轮询订单 paid |
| 3 | notify URL 在商户平台配置 | 与 `PAYMENT_NOTIFY_URL` 一致 |

### W8～W9 — 订阅生命周期

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | 取消订阅 API + UI | `cancelAtPeriodEnd` |
| 2 | 到期回 free | 文档化宽限期（建议 3 天） |
| 3 | 欠费停服策略 | 配额回落 free 限额 |

### W10～W11 — 退款与对账

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | 退款 SOP（人工） | 一页纸：谁处理、多久、支付宝/微信后台步骤 |
| 2 | 每日对账 checklist | `PaymentOrder` vs 商户后台 |
| 3 | notify 幂等复测 | 重复 POST 不重复升级 |

### W12～W14 — 生产切换（GA 前）

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | 生产 AppID / 商户号入 Vercel **Production** | `verify-env --require-cn-billing` |
| 2 | `ALIPAY_SANDBOX` 未设置；`ALLOW_DEV_BILLING` 未设置 | `check:release:billing` |
| 3 | 生产走一笔小额真单 | 维护者账号 Pro → 可退款 |
| 4 | 更新法务付费条款 | [PLAN_D3_LONGTERM.md](./PLAN_D3_LONGTERM.md) §4.3 |

---

## 环境变量速查（沙箱 → 生产）

| 变量 | 沙箱 | 生产 |
|------|:----:|:----:|
| `APP_URL` | localhost 或 ngrok | `https://ai-ide-flame.vercel.app` |
| `PAYMENT_NOTIFY_URL` | ngrok → API | 同 `APP_URL` 域 |
| `ALIPAY_SANDBOX` | `true` | 删除或 `false` |
| `ALIPAY_*` | 沙箱 AppID/密钥 | 生产 AppID/密钥 |
| `WECHAT_*` | 测试商户 | 生产商户 |

---

## 命令

```powershell
npm run billing:preflight
npm run dev:stack
npm run test:integration:local   # 有 DB 时
npm run check:release:billing    # 生产商户齐了之后
```

---

## 风险

| 风险 | 缓解 |
|------|------|
| 只有支付宝无微信 | GA 可仅支付宝；微信就绪后再开 |
| notify 不到达 | ngrok/Vercel 日志；`PAYMENT_NOTIFY_URL` |
| 付了未升级 | 订单补单脚本 + Issues 模板 |

---

## 当前周行动（立即）

1. 申请 **支付宝沙箱**（今天）  
2. `npm run billing:preflight` 看缺哪些 key  
3. 沙箱齐后走 **W3 支付宝 E2E**  
4. Phase 3 **P4-1** 并行（见 [PHASE3_KICKOFF.md](./PHASE3_KICKOFF.md)）
