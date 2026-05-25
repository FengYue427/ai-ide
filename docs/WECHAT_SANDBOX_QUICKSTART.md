# 微信 Native 沙箱 / 测试商户 — 接入指南

> 支付宝沙箱 E2E 完成后进入 **Phase 4 W6～W7**。配置见 [CN_PAYMENT_SETUP.md](./CN_PAYMENT_SETUP.md)。

## 前置

| 项 | 说明 |
|----|------|
| `PAYMENT_NOTIFY_URL` | 与支付宝相同：`ngrok http 3001` → HTTPS 域名 |
| `dev:stack` | API 3001 + 前端 3000 |
| 商户 | [CN_MERCHANT_APPLY_CHECKLIST.md](./CN_MERCHANT_APPLY_CHECKLIST.md) §微信 |

---

## 1. 商户平台准备

1. [微信支付商户平台](https://pay.weixin.qq.com/) 入驻或 **沙箱/测试号**（以平台当前入口为准）
2. 产品中心开通 **Native 支付**
3. **API 安全** → 设置 **APIv3 密钥**（32 位）
4. 申请 **商户 API 证书**，记下 **证书序列号**
5. 下载 **平台证书** 公钥（非商户公钥）
6. 关联 **AppID**（公众号/开放平台应用）

---

## 2. `.env.local` 片段

```env
PAYMENT_NOTIFY_URL=https://你的-ngrok-域名.ngrok-free.dev

WECHAT_APP_ID=wx........ 
WECHAT_MCH_ID=1xxxxxxxxx
WECHAT_API_V3_KEY=32位APIv3密钥
WECHAT_SERIAL_NO=商户API证书序列号
WECHAT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
WECHAT_PLATFORM_PUBLIC_KEY="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```

私钥/证书也可用 `WECHAT_PRIVATE_KEY_PATH`、`WECHAT_PLATFORM_PUBLIC_KEY_PATH` 指向 `secrets/` 下 pem 文件。

---

## 3. 验证

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run billing:preflight
npm run billing:wechat-probe
npm run dev:stack
```

期望：

```text
✅ 微信支付已配置（含平台证书公钥）
```

浏览器：登录 → 订阅 → 专业版 → **微信** → 弹出二维码 → 沙箱/测试 App 扫码付款。

---

## 4. 商户平台 notify URL

与 `PAYMENT_NOTIFY_URL` 一致：

```text
https://你的-ngrok-域名.ngrok-free.dev/api/payment/wechat/notify
```

生产（GA 前）：

```powershell
npm run payment:notify-urls
```

---

## 5. E2E 完成标准（W6～W7）

| # | 检查 |
|---|------|
| 1 | `CnPayModal` 仅显示已配置渠道（支付宝 / 微信） |
| 2 | 扫码后 `GET /api/payment/orders/:id` → `paid` |
| 3 | 订阅 **pro**；用量 **0/5000** |
| 4 | ngrok 见 `POST .../wechat/notify` → 200 |

记录写入 [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md) §国内支付沙箱。

---

## 6. 常见错误

| 现象 | 处理 |
|------|------|
| preflight 微信 ❌ | 缺 `WECHAT_PLATFORM_PUBLIC_KEY`（易漏平台证书） |
| 不出码 | 看 API 终端 checkout 报错；MCH_ID / 证书序列号是否匹配 |
| 付了未升级 | notify 502 → 确认 ngrok 指向 **3001** 且 `dev:stack` 在跑 |
| 仅测支付宝 | GA 可只开支付宝；微信就绪后再开 |
