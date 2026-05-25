# 正式上市（D3 GA）执行手册

> **站点**：https://ai-ide-flame.vercel.app  
> **决策**：[GA_LAUNCH_DECISION.md](./GA_LAUNCH_DECISION.md)  
> **验收**：[D3_GA_ACCEPTANCE.md](./D3_GA_ACCEPTANCE.md)  
> **部署**：[DEPLOY_D3_GA.md](./DEPLOY_D3_GA.md)

---

## 第 0 步：商户与法务（发布前 1～14 天）

| # | 事项 | 负责 |
|---|------|------|
| 1 | 支付宝开放平台 **生产** AppID、应用公钥、支付宝公钥 | 你 |
| 2 | 签约「电脑网站支付」或当面付等产品（与现网 notify URL 一致） | 你 |
| 3 | `payment.html` / `payment-en.html` 填公司名、信用代码、客服邮箱 | 法务/你 |
| 4 | 决定 **支付宝-only**（微信可后补） | 你 |

---

## 第 1 步：Vercel Production 环境变量

在 Vercel → Project → Settings → Environment Variables → **Production**：

```env
APP_URL=https://ai-ide-flame.vercel.app
DATABASE_URL=...
AUTH_SECRET=...

ALIPAY_APP_ID=生产AppID
ALIPAY_PRIVATE_KEY=或 ALIPAY_PRIVATE_KEY_PATH
ALIPAY_PUBLIC_KEY=支付宝公钥
# 不要设置 ALIPAY_SANDBOX

BILLING_CRON_SECRET=随机长串
# 或依赖 Vercel 自动 CRON_SECRET

VITE_SENTRY_DSN=https://...   # 强烈建议
VITE_GA_LIVE=true             # 欢迎页「正式版」徽章
```

**删除或勿设**：`ALLOW_DEV_BILLING`、`ALIPAY_SANDBOX`、`VITE_ALLOW_OFFLINE_AUTH`

支付宝 **异步通知地址**（在开放平台填）：

```text
https://ai-ide-flame.vercel.app/api/payment/alipay/notify
```

同步返回（return）：

```text
https://ai-ide-flame.vercel.app/?billing=success
```

（以你项目 `paymentOrigin` / 实际路由为准，发版前用 `npm run payment:notify-urls` 核对。）

---

## 第 2 步：本地与发布

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run test:local
npm run d3:preflight

# 若 Production 变量已可在本机通过 vercel env pull 验证：
npm run check:release:d3

npm run build:deploy
npx vercel --prod
```

```powershell
$env:APP_URL="https://ai-ide-flame.vercel.app"
npm run deploy:check
npm run smoke:report
```

---

## 第 3 步：生产冒烟（30 分钟）

1. 无痕窗口注册新账号  
2. 设置 → 填 BYOK 或依赖平台配额  
3. 订阅 → 应见 **支付宝** + 价格说明 + [付费说明](/legal/payment.html)  
4. 购买 **专业版 ¥19**（建议用小号真实付款）  
5. 刷新：配额约 **5000/日**；`GET /api/subscription` 为 pro  
6. 「周期结束后取消」→ 仍可用至 `currentPeriodEnd`  
7. （可选）`npm run billing:expire` 对测试账号验证降级提示  

记录订单号、截图、时间 → [D3_GA_ACCEPTANCE.md](./D3_GA_ACCEPTANCE.md) 签字。

---

## 第 4 步：对外公告

- 文案模板：[GA_ANNOUNCEMENT.md](./GA_ANNOUNCEMENT.md)  
- GitHub Release / CHANGELOG `1.0.0`  
- 可选：`git tag v1.0.0`（需你明确要求再执行 commit/tag）

---

## 第 5 步：发布后 72h 值班

| 日 | 动作 |
|----|------|
| D0 | 每 2h 看 Vercel Logs、`/api/payment/alipay/notify` 无 5xx |
| D0～D2 | [BILLING_RECONCILE_DAILY.md](./BILLING_RECONCILE_DAILY.md) |
| D1 | Sentry 是否有支付/订阅前端错误 |
| D3 | 复盘：转化、失败订单、是否开微信 |

**回滚**：Vercel Promote 上一部署 + 临时去掉 `ALIPAY_APP_ID`（回到 Path A 公测文案）。

---

## 版本号建议

| 标签 | 含义 |
|------|------|
| `v1.0.0` | D3 正式上市 |
| `v1.1.0-rc` | 已存在于 CHANGELOG，保留历史 |

`package.json` 发 GA 时改为 `1.0.0`（与 `VITE_APP_VERSION` / Sentry release 一致）。
