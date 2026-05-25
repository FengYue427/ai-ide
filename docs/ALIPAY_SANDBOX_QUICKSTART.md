# 支付宝沙箱 — 5 分钟接入本地

> 对应开放平台 **沙箱应用** 页（`open.alipay.com` → 开发 → 沙箱）。

## 1. 从截图页面复制

| 支付宝页面 | 写入 `.env.local` |
|------------|-------------------|
| **APPID**（如 `9021000164604667`） | `ALIPAY_APP_ID` |
| **接口加签方式 → 公钥模式 → 已启用** | 需复制两把密钥，见下 |

在 **开发信息** 区域：

1. 点 **查看** / **设置**（系统默认密钥或自定义密钥均可）  
2. 复制 **应用私钥** → `ALIPAY_PRIVATE_KEY`（整段 PEM，含 `BEGIN`/`END`）  
3. 复制 **支付宝公钥**（不是应用公钥）→ `ALIPAY_PUBLIC_KEY`

私钥在 `.env` 里任选一种写法：

**A. 多行 + 双引号**（与开放平台复制格式一致，首尾各一行引号）：

```env
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIE...多行base64...
-----END RSA PRIVATE KEY-----"
```

**B. 单行** 用 `\n`：

```env
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"
```

**C. 文件路径**（最省心）— 把 PEM 存为 `secrets/alipay-app-private.pem`，设置：

```env
ALIPAY_PRIVATE_KEY_PATH=secrets/alipay-app-private.pem
```

（`secrets/` 应在 `.gitignore` 中，勿提交 Git。）

## 2. 最小 `.env.local` 片段（沙箱）

```env
APP_URL=http://localhost:3000
AUTH_SECRET=你的本地随机串

# 支付宝沙箱（与截图一致）
ALIPAY_SANDBOX=true
ALIPAY_APP_ID=你的沙箱APPID
ALIPAY_PRIVATE_KEY="你的应用私钥PEM"
ALIPAY_PUBLIC_KEY="支付宝公钥PEM"
# 可选显式网关（不设也会因 ALIPAY_SANDBOX=true 自动用沙箱）
# ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do
```

**沙箱电脑网站支付必须**配置 HTTPS 的 `PAYMENT_NOTIFY_URL`（ngrok 到 API `3001`）。  
若用 `http://localhost:3000` 当 notify，支付宝会跳到 **`/error`** 登录页（你截图那种情况）。  
仅测付款后升级 Pro 也需要 notify 能打到本机 API。

## 3. 验证

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run billing:preflight
npm run dev:stack
```

另开终端：

```powershell
curl http://127.0.0.1:3001/api/subscription/payment-methods
```

期望 JSON 含 `"alipay":true`（登录前可能为 false，登录后订阅页更重要）。

浏览器：`http://localhost:3000` → 登录 → 订阅 → 专业版 → **支付宝** → 沙箱收银台。

## 4. HTTPS 隧道 + PAYMENT_NOTIFY_URL（沙箱下单必填）

支付宝 **不能** 用 `localhost` 当 `notify_url`，需要公网 HTTPS 指到本机 API **3001**。

### 方式 A — 不用安装 ngrok（推荐先试）

**终端 1**（保持运行）：

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run tunnel:api
```

会打印类似 `your url is: https://xxxx.loca.lt`，写入 `.env.local`：

```env
PAYMENT_NOTIFY_URL=https://xxxx.loca.lt
```

**终端 2**：`npm run dev:stack`

### 方式 B — 安装 ngrok（长期）

完整图文步骤见 **[NGROK_WINDOWS_SETUP.md](./NGROK_WINDOWS_SETUP.md)**（注册、PATH、authtoken、双终端日常流程）。

重启 `dev:stack`。可运行诊断：

```powershell
npm run billing:alipay-probe
```

期望：`✅ 网关未直接返回 error`，而不是 `goto=.../error`。

## 5. 测 notify（付款后自动升级）

1. `ngrok http 3001`（或 cloudflared tunnel）  
2. `.env.local` 增加：

```env
PAYMENT_NOTIFY_URL=https://你的隧道域名
```

3. 支付宝沙箱 **应用网关** 可留空；异步通知走 `createCnCheckout` 里配置的 `notify_url`（代码使用 `PAYMENT_NOTIFY_URL` + `/api/payment/alipay/notify`）  
4. 重启 `dev:stack`，再走一笔沙箱付款 → 刷新后应为 Pro

生产 notify（日后 Vercel）：

```powershell
npm run payment:notify-urls
```

## 6. 沙箱买家账号

沙箱页 **沙箱账号** 标签中有买家登录账号/密码，用于在收银台付款。

## 7. 常见错误

| 现象 | 处理 |
|------|------|
| preflight 支付宝 ❌ | 缺 `ALIPAY_PUBLIC_KEY`（易漏） |
| `[Checkout] Cannot read properties of undefined (reading 'includes')` | **密钥 PEM 不完整**：须 **首尾双引号包住多行**，或 `*_PATH` 指向 `.pem`，或单行 `\\n`。不要多行且**无引号**（只会读第一行） |
| preflight ⚠️ PEM 可能无效 | 同上，改 `secrets/*.pem` 或单行 `\n` 后重启 `dev:stack` |
| checkout 503 alipayNotConfigured | 重启 `dev:stack` 使 env 生效 |
| 打开收银台跳到 `/error` | `notify_url` 用了 localhost → 必须 `PAYMENT_NOTIFY_URL` 为 **HTTPS ngrok** |
| 付了仍是 free | notify 未打到本机 API → 确认 ngrok 指向 **3001** 且重启 dev:stack |
| 验签失败 | 私钥/公钥与应用不匹配，重新复制沙箱密钥 |

## 8. 下一步

- 沙箱 E2E 通过 → [PHASE4_CN_PAYMENT.md](./PHASE4_CN_PAYMENT.md) W3～W5  
- 再开通微信沙箱/测试商户
