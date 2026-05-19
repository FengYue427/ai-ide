# Vercel 部署地址说明（ai-ide 项目）

> 针对当前生产环境：`ai-ide-flame.vercel.app`

## 两种 URL 的区别

| 类型 | 示例 | 用途 |
|------|------|------|
| **生产域名** | `https://ai-ide-flame.vercel.app` | 对外分享、配置 `APP_URL`、支付回调 |
| **单次部署 URL** | `https://ai-11uulky1k-lyyu8993-1400s-projects.vercel.app` | 仅 Vercel 面板预览；**常带访问保护** |

## 面板里看到 403 Forbidden？

预览图里的：

```text
403: Forbidden
ID: hkg1::xxxx-...
```

这是 **Vercel Deployment Protection（部署保护）**，不是 AI IDE 代码报错。带随机 hash 的 `*.vercel.app` 部署链接默认可能仅团队成员可访问。

### 处理方式（二选一）

**A. 对外使用生产域名（推荐）**

在浏览器打开：**https://ai-ide-flame.vercel.app**

**B. 关闭部署保护（若必须用部署 URL 测试）**

1. Vercel → 项目 **ai-ide** → **Settings**
2. **Deployment Protection**
3. Production：设为 **仅 Standard Protection 关闭** 或按需添加 Bypass
4. Preview：若需公开 Preview，关闭 *Vercel Authentication* / 仅允许团队改为公开

## 必配环境变量（Production）

在 **Settings → Environment Variables** 中设置：

| 变量 | 值 |
|------|-----|
| `APP_URL` | `https://ai-ide-flame.vercel.app` |
| `DATABASE_URL` | Neon Pooled 连接串 |
| `AUTH_SECRET` | 新生成的随机串（勿与本地相同） |

**不要**在 Production 设置：`ALLOW_DEV_BILLING`、`VITE_ALLOW_OFFLINE_AUTH`。

保存后 **Redeploy** 一次 Production。

## 部署后自检

```powershell
cd C:\Users\18663\IDE\ai-ide

# 本地先绿
npm run rc:preflight

# 远程（替换为你的生产域名）
$env:APP_URL="https://ai-ide-flame.vercel.app"
npm run deploy:check
npm run smoke:production -- $env:APP_URL
```

浏览器手动检查：

1. 打开 `https://ai-ide-flame.vercel.app` → 应看到欢迎页 / IDE，而不是 Vercel 403 页  
2. 打开 `https://ai-ide-flame.vercel.app/api/health` → 应返回 JSON（`status: ok`，`database: connected`）

若 `/api/health` 返回 **404** 或 HTML 欢迎页：确认已 push 含 `api/[...path].ts` 的最新 `main`（纯 Vite 不要用 `api/**/route.ts`）。

## 当前部署可能过旧

若 Vercel 显示最近提交为 `feat: Phase 1 - Auth API...`，而本地已有 IDE-2/3、MCP、Git 面板等改动，需要：

```powershell
git add .
git commit -m "chore: RC IDE-2/3 + deploy docs"
git push origin main
```

在 Vercel Deployments 等待新构建 **Ready** 后再测。

## 相关文档

- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
- [VERCEL_SETUP.md](./VERCEL_SETUP.md)
- [BROWSER_LIMITATIONS.md](./BROWSER_LIMITATIONS.md)
