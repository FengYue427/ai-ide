# 观测与错误上报

## 内置（无需配置）

- **API**：`GET /api/health` — 数据库连通性，供 Uptime 与 `npm run smoke:production`
- **前端**：`src/lib/observability.ts` 在 `main.tsx` 注册 `window.error` / `unhandledrejection`，`ErrorBoundary` 会调用 `reportError`

## 可选：Sentry（推荐生产）

1. 在 [sentry.io](https://sentry.io) 创建项目，拿到 DSN  
2. 安装依赖：`npm install @sentry/react`  
3. 在 `src/main.tsx` 的 `initObservability()` 之后添加：

```ts
import * as Sentry from '@sentry/react'
import { setErrorReporter } from './lib/observability'

const dsn = import.meta.env.VITE_SENTRY_DSN
if (dsn) {
  Sentry.init({ dsn, environment: import.meta.env.MODE })
  setErrorReporter((error, context) => {
    Sentry.captureException(error, { extra: context })
  })
}
```

4. Vercel 环境变量：`VITE_SENTRY_DSN=https://...@sentry.io/...`

## 可选：Vercel Analytics

在 Vercel 项目设置中启用 **Web Analytics**，无需改代码即可查看页面访问。

## 客服 / 运维脚本

```bash
npm run admin:lookup -- user@example.com
```

需要可访问的 `DATABASE_URL`（生产库请用只读账号或临时连接）。

## API 5xx 告警

- Vercel：**Observability → Logs**，对 `status:500` 配置通知  
- 外部监控：每 1～5 分钟请求 `GET https://<domain>/api/health`，非 200 告警
