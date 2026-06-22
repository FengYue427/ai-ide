# 生产环境变量

构建前端时 Vite 读取 `.env.production`（或 Vercel/构建机环境）。API 运行时读取服务器 `.env.production`（`deploy/aliyun/env.production.example` 为阿里云模板）。

## 前端构建（VITE_*）

复制 `.env.production.example` → `.env.production`：

| 变量 | 推荐值 | 说明 |
|------|--------|------|
| `VITE_AI_GATEWAY` | `true` | 平台 AI 网关 |
| `VITE_ALLOW_BYOK_LEGACY` | `false` | 关闭旧 BYOK 路径 |
| `VITE_TAB_PLUS_PLUS` | `true` | Tab++ 内联补全 |
| `VITE_AIDE_SPEC_ARTIFACTS_V2` | `true` | Spec Studio + hooks 目录 |
| `VITE_AIDE_RUNTIME` | `true` | Runtime 编排引擎 |
| `VITE_AIDE_RUNTIME_UI` | `true` | Activity Line 与编排 UI（与 Runtime 配套） |
| `VITE_AIDE_ACTIVITY_LINE` | `true` | Activity Line UI |
| `VITE_GA_LIVE` | `true` | 欢迎页 GA 徽章（计费已上线） |
| `VITE_PUBLIC_WELFARE` | 不设或 `false` | `true` 隐藏升级按钮（福利模式） |
| `VITE_SENTRY_DSN` | 可选 | 前端错误上报 |

**默认关闭（按需开启）：**

| 变量 | 说明 |
|------|------|
| `VITE_COLLAB_M1_SIGNAL` | 协作 M1 |
| `VITE_BACKGROUND_AGENT` | 后台 Agent UI |
| `VITE_MULTI_ROOT` | 多根工作区 |

桌面构建使用 `.env.electron`（含 `VITE_API_BASE_URL` 指向备案域名）。

## API 运行时（服务端）

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | Neon（Vercel）或阿里云 RDS |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `APP_URL` | ✅ 生产 | `https://备案域名`，无末尾 `/` |
| `AUTH_URL` | 推荐 | 与 `APP_URL` 相同 |
| `PUBLIC_WELFARE_MODE` | 推荐 `false` | 关闭则开启订阅收款 |
| `CRON_SECRET` | 阿里云必填 | Cron 鉴权 |
| `BILLING_CRON_SECRET` | 可选 | 可与 `CRON_SECRET` 相同 |
| `PLATFORM_DEEPSEEK_API_KEY` | 国内推荐 | 平台 AI |
| `ALIPAY_*` | 收费必填 | 见 `payment-notify-urls.mjs` |
| `VITE_SENTRY_DSN` | 可选 | 仅构建时需要；API 侧 Sentry 未默认接入 |

## 校验命令

```bash
npm run verify:env:prod
npm run verify:env:v16 --require-cn-billing
node scripts/payment-notify-urls.mjs
```

## Vercel vs 阿里云

| 项 | Vercel | 阿里云 |
|----|--------|--------|
| `DATABASE_URL` | Neon pooler + SSL | RDS 内网 + `sslmode=disable` |
| Cron | `vercel.json` | `deploy/aliyun/crontab.example` |
| API | Serverless `api/index.js` | PM2 + `start:api:production` |
| 前端 | 构建时 env 在 Vercel 控制台 | 构建机 `.env.production` 后 rsync `dist/` |

完整迁移步骤：[DEPLOY_ALIYUN_CN.md](./DEPLOY_ALIYUN_CN.md) · P0 清单：[CN_LAUNCH_P0.md](./CN_LAUNCH_P0.md)。
