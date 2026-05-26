# 自定义域名部署（v1.0.2.6）

> 缓解国内访问 `*.vercel.app` 不稳定的问题。生产环境需同时配置 **Vercel 域名** 与 **环境变量 `APP_URL`**。

## 1. Vercel 绑定域名

1. Vercel 项目 → **Settings → Domains** → 添加你的域名（如 `ide.example.com`）。
2. 按提示在 DNS 添加 **CNAME** 或 **A** 记录。
3. 等待证书签发（通常数分钟）。

## 2. 环境变量

在 Vercel **Environment Variables** 中设置（Production + Preview 按需）：

| 变量 | 示例 | 说明 |
|------|------|------|
| `APP_URL` | `https://ide.example.com` | OAuth 回调、Stripe/支付宝 return URL、健康检查文案 |
| `AUTH_SECRET` | 32+ 随机字符 | 已有则保持不变 |
| `DATABASE_URL` | Postgres 连接串 | 已有则保持不变 |

**重要**：`APP_URL` 必须与用户浏览器地址栏 **完全一致**（含 `https`，无尾部 `/`）。

## 3. OAuth / 支付回调

- GitHub / Google OAuth：在对应开发者控制台把 **Authorized redirect URI** 改为  
  `https://ide.example.com/api/auth/callback/...`（与当前 `APP_URL` 一致）。
- Stripe / 支付宝：return URL 由服务端 `APP_URL` 生成，无需硬编码 vercel.app。

## 4. CORS 与 API

- 前端与 `/api/*` 同域部署时 **无需额外 CORS**。
- 若 API 与静态站分域，需在 `api/index.js` 允许的前端 origin 中加入自定义域（当前默认同源）。

## 5. 验证

```powershell
npm run go-live:preflight
# 浏览器打开自定义域 → 欢迎页页脚应显示「当前访问地址：https://ide.example.com」
```

## 6. 桌面版

Electron 壳默认加载线上 UI；自定义域生效后，桌面用户同样受益（仍依赖网络加载前端资源）。

---

**下一主版本**：CDN / 多区域加速见 [ROADMAP_V1.0.3.md](./ROADMAP_V1.0.3.md)。
