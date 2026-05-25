# 支付宝 / 微信支付配置（国内订阅）

面向国内用户：**支付宝电脑网站支付** + **微信 Native 扫码**。配置完成后，`dev_mock` 自动关闭，走真实收银台。

> **路线**：国内优先 → D3 GA — [PAYMENT_DECISION_CN_2026-05.md](./PAYMENT_DECISION_CN_2026-05.md) · 周计划 [PHASE4_CN_PAYMENT.md](./PHASE4_CN_PAYMENT.md) · 商户申请 [CN_MERCHANT_APPLY_CHECKLIST.md](./CN_MERCHANT_APPLY_CHECKLIST.md)

## 定价与配额（宽松默认值）

| 计划 | 月费 | AI 配额/日 | 云工作区 |
|------|------|------------|----------|
| 免费版 | ¥0 | 200 | 10 |
| 专业版 | **¥19** | 5000 | 不限 |
| 团队版 | **¥49** | 不限 | 不限 |

修改价格与配额：编辑 `lib/billing/plans.ts` 后执行 `npm run db:seed`（或 `npm run db:neon`）同步数据库。

---

## 0. 支付宝沙箱快速接入

已有沙箱 APPID（开放平台 → 沙箱应用）→ **[ALIPAY_SANDBOX_QUICKSTART.md](./ALIPAY_SANDBOX_QUICKSTART.md)**（复制密钥 → `.env.local` → `billing:preflight`）。

## 0b. 配置前检查

```bash
npm run billing:preflight
```

会读取 `.env.local` 并提示缺失项与沙箱网关。

---

## 1. 环境变量

`.env.local` / Vercel：

```env
APP_URL=https://你的域名.com
# 本地浏览器回跳
# APP_URL=http://localhost:3000

# 异步通知（必须与 API 同域可达）。本地开发用 ngrok：
# PAYMENT_NOTIFY_URL=https://xxxx.ngrok-free.app

# ---------- 支付宝 ----------
ALIPAY_APP_ID=2021xxxxxxxx
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
# 沙箱（推荐先联调）：
ALIPAY_SANDBOX=true
# 或显式指定：
# ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do

# ---------- 微信支付 ----------
WECHAT_APP_ID=wx........ 
WECHAT_MCH_ID=1xxxxxxxxx
WECHAT_API_V3_KEY=32位APIv3密钥
WECHAT_SERIAL_NO=商户API证书序列号
WECHAT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
WECHAT_PLATFORM_PUBLIC_KEY="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```

检查接口：

```bash
curl http://127.0.0.1:3001/api/subscription/payment-methods
# {"alipay":true,"wechat":true,"stripe":false,"devMock":false}
```

---

## 2. 支付宝

1. [支付宝开放平台](https://open.alipay.com/) 创建应用 → **电脑网站支付**
2. 配置密钥：应用私钥 + 支付宝公钥
3. **异步通知**（生产）：
   ```text
   https://你的域名/api/payment/alipay/notify
   ```
4. 沙箱：`ALIPAY_SANDBOX=true`，使用沙箱 AppID 与沙箱账号付款

用户流程：订阅弹窗 → **支付宝支付** → 跳转收银台 → 回到 `/?subscription=success&plan=pro`。

---

## 3. 微信支付

1. [微信支付商户平台](https://pay.weixin.qq.com/) 开通 **Native 支付**
2. API 安全：APIv3 密钥、商户 API 证书（`WECHAT_PRIVATE_KEY` + `WECHAT_SERIAL_NO`）
3. 下载 **平台证书**，配置 `WECHAT_PLATFORM_PUBLIC_KEY`（验签与 SDK 必需）
4. **支付通知 URL**：
   ```text
   https://你的域名/api/payment/wechat/notify
   ```

用户流程：选 **微信支付** → 扫码 → notify 到账后自动升级（前端轮询订单状态）。

---

## 4. 本地联调（重要）

| 场景 | 配置 |
|------|------|
| 仅测下单跳转 | `APP_URL=http://localhost:3000`，支付宝可沙箱付款 |
| 测自动升级（notify） | `ngrok http 3001` → `PAYMENT_NOTIFY_URL=https://xxx.ngrok.app` |
| 无商户密钥 | `npm run dev:stack` 且无支付宝/微信 env → 仍可用 `dev_mock`（见 BILLING_SKELETON） |

```bash
npm run dev:stack
# 另开终端
npm run billing:preflight
```

登录 → 设置/工具栏打开订阅 → 选专业版 → `CnPayModal` 选支付宝或微信。

开发模拟（不经过真实支付）：

```bash
POST /api/payment/dev/simulate  # 仅非 production
```

---

## 5. 数据库

```bash
npm run db:neon
```

含 `PaymentOrder` 表；套餐种子来自 `lib/billing/plans.ts`。

---

## 6. 与 Stripe

- 国内主流程：**支付宝 + 微信**
- 配置 `STRIPE_*` 后可选海外 checkout / 客户门户，不影响国内弹窗

手工 QA：[AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md)
