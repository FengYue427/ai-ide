# 基础骨架验收清单（配置支付宝/微信之前）

在接入真实商户前，用本清单确认 **认证 + 订阅 + 支付订单** 链路完整、可测、可重复。

## 一键检查

```bash
npm run db:neon          # 含 PaymentOrder 表
npm run check:skeleton   # 路由 + test:local
npm run dev:stack        # 另开终端
npm run test:integration:local
```

全部通过即可认为骨架就绪。

---

## 1. 认证骨架

| 项 | API / 行为 | 验收 |
|----|------------|------|
| 注册 | `POST /api/auth/register` | 返回 user + Set-Cookie |
| 登录 | `POST /api/auth/callback/credentials` | 同上 |
| 会话 | `GET /api/auth/session` | 登录后 `user.email` 正确 |
| 登出 | `POST /api/auth/signout` | 清除 `auth-token` + Auth.js cookies |
| 限流 | 注册/登录 | 超限返回 429 |
| 生产 Cookie | `Secure` | `NODE_ENV=production` 时自动带上 |

OAuth（可选，稍后配置）：`/api/auth/oauth/*` + `?oauth_sync=1`

---

## 2. 订阅骨架

| 项 | API | 验收 |
|----|-----|------|
| 当前计划 | `GET /api/subscription` | 未付费为 `free` |
| 套餐列表 | `GET /api/subscription/plans` | 含 free/pro/enterprise（CNY） |
| 支付方式 | `GET /api/subscription/payment-methods` | `devMock` / `alipay` / `wechat` 布尔值 |
| 开发升级 | `POST /api/subscription/checkout` 无 channel | `mode: dev_mock` |
| 取消/恢复 | `POST cancel` / `resume` | 集成测试通过 |

---

## 3. 支付订单骨架（国内）

| 项 | 说明 |
|----|------|
| 表 | `PaymentOrder` — outTradeNo、channel、status |
| 开发模拟 | `POST /api/payment/dev/simulate` — 创建订单并履约（仅非 production） |
| 履约 | `fulfillPaymentOrder` — **幂等**，重复 notify 不重复扣逻辑 |
| 支付宝 notify | `POST /api/payment/alipay/notify` — 未配置时 501 |
| 微信 notify | `POST /api/payment/wechat/notify` — 未配置时 501 |
| 订单查询 | `GET /api/payment/orders/:id` — 仅本人、登录态 |

配置商户后：

- `POST /api/subscription/checkout` + `{ planId, channel: "alipay"|"wechat" }`
- 前端 `CnPayModal` 跳转/扫码

---

## 4. 健康检查

`GET /api/health` 应包含：

```json
{
  "status": "ok",
  "database": "connected",
  "billing": {
    "alipay": false,
    "wechat": false,
    "stripe": false,
    "devMock": true
  }
}
```

---

## 5. 前端

| 项 | 验收 |
|----|------|
| 未登录升级 | 提示先登录 |
| 有 devMock | 订阅弹窗可假升级 |
| 有 alipay/wechat | 显示「支付宝 / 微信升级」→ `CnPayModal` |
| 支付成功回站 | `?subscription=success&plan=` 刷新计划 |

---

## 6. 禁止项（生产）

- `ALLOW_DEV_BILLING=true` — 禁止
- `VITE_ALLOW_OFFLINE_AUTH=true` — 禁止
- 未配置支付宝/微信且关闭 devMock — 应对用户返回 503 明确文案

---

## 7. 后续：接入真实支付

见 [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md)。接入后 `billing.alipay` / `billing.wechat` 为 `true`，`devMock` 自动为 `false`。
