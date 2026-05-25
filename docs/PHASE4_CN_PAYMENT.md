# Phase 4 — 国内支付（支付宝 + 微信优先）

> **决策**：[PAYMENT_DECISION_CN_2026-05.md](./PAYMENT_DECISION_CN_2026-05.md)  
> **与 Phase 3 并行**：索引续包不阻塞本轨道。

## 进度快照（2026-05-25）

| 轨道 | 状态 |
|------|------|
| **W1～W2 准备** | ✅ 沙箱 AppID、preflight、ngrok 文档 |
| **W3～W5 支付宝沙箱 E2E** | ✅ 付款、回跳补单、Pro + 0/5000 配额 |
| **W6～W7 微信** | ⬜ 待商户 env + Native E2E |
| **W8 生命周期** | ✅ 取消/恢复/到期降级 — [BILLING_SUBSCRIPTION_LIFECYCLE.md](./BILLING_SUBSCRIPTION_LIFECYCLE.md) |
| **W9+ 生产 / 对账** | ⬜ 见下表 |

支付宝细节：[ALIPAY_SANDBOX_QUICKSTART.md](./ALIPAY_SANDBOX_QUICKSTART.md) · [NGROK_WINDOWS_SETUP.md](./NGROK_WINDOWS_SETUP.md)  
微信下一步：[WECHAT_SANDBOX_QUICKSTART.md](./WECHAT_SANDBOX_QUICKSTART.md)

---

## 目标

| 里程碑 | 日期（参考） | 标准 |
|--------|--------------|------|
| **B0** | 2026-06-07 | 商户申请已提交（支付宝沙箱可用） |
| **B1** | 2026-08-31 | 沙箱：付款 → notify/回跳 → 订阅 Pro + 订单 paid |
| **B2** | 2026-09-20 | 取消订阅、到期降级、退款流程（至少人工 SOP） |
| **B3** | GA 前 | 生产商户 + 7 天无 P0 支付事故 |

---

## 周计划

### W1～W2（2026-05-25 ～ 06-07）— 准备 ✅

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | 沙箱 AppID + 密钥 | [ALIPAY_SANDBOX_QUICKSTART.md](./ALIPAY_SANDBOX_QUICKSTART.md) |
| 2 | `.env.local` + `billing:preflight` 支付宝 ✅ | 完成 |
| 3 | ngrok + `PAYMENT_NOTIFY_URL` | [NGROK_WINDOWS_SETUP.md](./NGROK_WINDOWS_SETUP.md) |
| 4 | 生产 Vercel **仍路径 A** | 勿误开生产商户 env |

### W3～W5 — 支付宝沙箱 E2E ✅

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | `dev:stack` + 登录 | `alipay:true` |
| 2 | 订阅 → 支付宝 | 沙箱收银台 |
| 3 | 付款回跳 | `alipay.trade.page.pay.return` → `/api/payment/alipay/return` |
| 4 | 升级 Pro | 订单 paid；配额 5000/日；工具栏「升级团队版」 |
| 5 | QA 记录 | [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md) §国内支付沙箱 |

**补单命令**（notify/回跳失败时）：

```powershell
npm run billing:reconcile -- aide_<订单号>
```

### W6～W7 — 微信沙箱 E2E ⬜ 当前

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | 微信测试商户 env | preflight 微信 ✅ — [WECHAT_SANDBOX_QUICKSTART.md](./WECHAT_SANDBOX_QUICKSTART.md) |
| 2 | Native 扫码 | `CnPayModal` 出码；轮询 paid |
| 3 | notify URL | `{PAYMENT_NOTIFY_URL}/api/payment/wechat/notify` |

### W8 — 订阅生命周期 ✅

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | 取消订阅 API + UI | `POST /api/subscription/cancel` + 订阅弹窗 |
| 2 | 到期回 free | 宽限期 3 天；`GET /api/subscription` + `billing:expire` |
| 3 | 到期 UI 提示 | Chat `chat.subscriptionExpired` |

### W9 — 欠费与运维

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | 欠费停服策略 | 配额回落 free 限额（已随到期降级） |
| 2 | Vercel Cron 配置 `BILLING_CRON_SECRET` | 每日调用 expire API |

### W10～W11 — 退款与对账

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | 退款 SOP（人工） | 一页纸 |
| 2 | 每日对账 checklist | `PaymentOrder` vs 商户后台 |
| 3 | notify 幂等复测 | `fulfillOrder.test.ts` + 手工重复 POST |

### W12～W14 — 生产切换（GA 前）

| # | 任务 | 完成标准 |
|---|------|----------|
| 1 | 生产 AppID / 商户号入 Vercel **Production** | `verify-env --require-cn-billing` |
| 2 | 无 `ALIPAY_SANDBOX` / `ALLOW_DEV_BILLING` | `check:release:billing` |
| 3 | 生产小额真单 | 维护者 Pro → 可退款 |
| 4 | 更新法务付费条款 | [PLAN_D3_LONGTERM.md](./PLAN_D3_LONGTERM.md) §4.3 |

---

## 环境变量速查（沙箱 → 生产）

| 变量 | 沙箱 | 生产 |
|------|:----:|:----:|
| `APP_URL` | localhost | `https://ai-ide-flame.vercel.app` |
| `PAYMENT_NOTIFY_URL` | ngrok → API 3001 | 同 `APP_URL` 域 |
| `ALIPAY_SANDBOX` | `true` | 删除或 `false` |
| `ALIPAY_*` | 沙箱 | 生产 |
| `WECHAT_*` | 测试商户 | 生产 |

---

## 命令

```powershell
npm run billing:preflight
npm run billing:alipay-probe
npm run billing:reconcile -- aide_xxx
npm run dev:stack
npm run check:release:billing    # 生产商户齐了之后
```

---

## 风险

| 风险 | 缓解 |
|------|------|
| notify 502 | ngrok 指 3001；回跳 `/api/payment/alipay/return` 补单 |
| 付了未升级 | `billing:reconcile` |
| 只有支付宝无微信 | GA 可仅支付宝 |

---

## 当前行动

1. **微信 W6**：商户平台 + [WECHAT_SANDBOX_QUICKSTART.md](./WECHAT_SANDBOX_QUICKSTART.md)  
2. **并行** Phase 3 P4-1 索引续包  
3. **生产 Vercel** 仍 Path A
