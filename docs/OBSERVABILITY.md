# 观测与错误上报

## 内置（无需配置）

- **API**：`GET /api/health` — 数据库连通性，供 Uptime 与 `npm run smoke:production`
- **API 请求链路**：每个 `/api/*` 响应带 `X-Request-Id`；Vercel Logs 为 JSON 行（`api.request`、`auth.login.success` 等）
- **前端**：`src/lib/observability.ts` 注册 `window.error` / `unhandledrejection`；`ErrorBoundary` 调用 `reportError`
- **前端 API**：`apiFetch()` 自动附带 `X-Request-Id`，便于与后端日志关联
- **业务事件**：`trackEvent()`（前端）、`trackServerEvent()`（API handler）

### 结构化 API 日志示例

```json
{"ts":"...","level":"info","message":"api.request","requestId":"...","route":"auth/register","method":"POST","status":200,"durationMs":42}
{"ts":"...","level":"info","message":"auth.login.success","event":"auth.login.success","requestId":"...","userId":"..."}
```

## 可选：Sentry（推荐生产）

1. 在 [sentry.io](https://sentry.io) 创建项目，拿到 DSN  
2. 安装依赖：`npm install @sentry/react`  
3. 设置 Vercel 环境变量：`VITE_SENTRY_DSN=https://...@sentry.io/...`

应用会在 `main.tsx` 中通过 `initOptionalSentry()` 自动初始化（DSN 存在且依赖已安装时）。

- **Release 标签**：构建时注入 `VITE_APP_VERSION`（来自 `package.json`），Sentry 事件为 `ai-ide@<version>`；Vercel 亦可设 `VITE_VERCEL_GIT_COMMIT_SHA` 作 fallback。
- **GA 验收**：故意触发一次前端错误，在 Sentry Issues 中确认 environment=`production`（见 [D3_GA_ACCEPTANCE.md](./D3_GA_ACCEPTANCE.md) §E）。
- **v1.0.3**：部署后 release 应为 `ai-ide@1.0.3`；步骤见 [V1.0.3_RELEASE.md](./V1.0.3_RELEASE.md)。

也可手动扩展 `setErrorReporter` / `setEventReporter`（见 `src/lib/observability.ts`）。

## 可选：Vercel Analytics

在 Vercel 项目设置中启用 **Web Analytics**，无需改代码即可查看页面访问。

## 客服 / 运维脚本

```bash
npm run admin:lookup -- user@example.com
```

需要可访问的 `DATABASE_URL`（生产库请用只读账号或临时连接）。

## API 5xx 告警

- Vercel：**Observability → Logs**，过滤 `level":"error"` 或 `api.unhandled`
- 外部监控：每 1～5 分钟请求 `GET https://<domain>/api/health`，非 200 告警

## 发布与回滚

见 [RELEASE_RUNBOOK.md](./RELEASE_RUNBOOK.md)。
