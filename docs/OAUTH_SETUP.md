# GitHub / Google（Gmail）登录配置

OAuth 与邮箱密码**共用** `DATABASE_URL`、`AUTH_SECRET`。首次 OAuth 登录会自动**注册**账号（无需单独注册页）。

## 1. 环境变量

`.env.local` 与 Vercel Production：

| 变量 | 说明 |
|------|------|
| `AUTH_SECRET` | 与邮箱登录相同 |
| `AUTH_URL` 或 `APP_URL` | 公网地址，如 `http://localhost:3000` / `https://你的域名.vercel.app` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth App |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google Cloud OAuth（可用 Gmail 登录） |
| `VITE_ENABLE_OAUTH` | 前端显示按钮：`true` |

检查是否配齐：

```bash
curl http://localhost:3001/api/auth/oauth/providers
# {"github":true,"google":true,"any":true}
```

## 2. GitHub OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New**
2. **Authorization callback URL**（本地）：
   ```text
   http://localhost:3000/api/auth/oauth/callback/github
   ```
   生产把 host 换成你的 Vercel 域名。
3. 复制 Client ID / Client Secret → `AUTH_GITHUB_*`

> 使用 `npm run dev:stack` 时，Vite 会把 `/api` 代理到 3001，回调 URL 仍写 **3000**（浏览器地址栏端口）。

## 3. Google OAuth（Gmail）

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. **OAuth 2.0 Client ID** → Web application
3. **Authorized redirect URIs**：
   ```text
   http://localhost:3000/api/auth/oauth/callback/google
   ```
4. 复制 Client ID / Secret → `AUTH_GOOGLE_*`

## 4. 本地验证

```bash
# .env.local 填入上述变量 + VITE_ENABLE_OAUTH=true
npm run dev:stack
```

1. 打开 `http://localhost:3000` → 登录
2. 应看到 **GitHub** / **Google** 按钮（且 `/api/auth/oauth/providers` 为 true）
3. 完成授权后 URL 带 `?oauth_sync=1`，自动写入 `auth-token` Cookie
4. 顶栏显示已登录邮箱

## 5. 说明

- **注册**：OAuth 首次登录 = 自动建号 + 默认工作区（与邮箱注册相同）。
- **与邮箱账号合并**：同一邮箱若已用密码注册，Auth.js/Prisma 可能提示账号关联；建议先用 OAuth 或先用邮箱，避免重复邮箱。
- **仅邮箱密码**：不配置 OAuth 变量即可，不影响现有流程。

详见 [AUTH_BILLING_QA.md](./AUTH_BILLING_QA.md)。
