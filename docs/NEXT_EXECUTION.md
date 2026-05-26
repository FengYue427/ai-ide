# 当前执行清单 — v1.0.3 已交付（代码）

> **全状态**：[V1.0.2_STATUS_SUMMARY.md](./V1.0.2_STATUS_SUMMARY.md)（能力仍以 v1.0.2 为基，运维见 v1.0.3）  
> **v1.0.3 发布说明**：[V1.0.3_RELEASE.md](./V1.0.3_RELEASE.md)  
> **下一版开发**：[ROADMAP_V1.0.3-V1.0.9.md](./ROADMAP_V1.0.3-V1.0.9.md) → **v1.0.4 块级 Diff**  
> **站点**：https://ai-ide-flame.vercel.app

---

## v1.0.3 代码侧 ✅

| 项 | 状态 |
|----|:----:|
| 双 secret Cron 鉴权 + 单测 | ✅ |
| `billing:verify-cron` | ✅ |
| payment 运营主体 | ✅ |
| BROWSER_LIMITATIONS 对齐 | ✅ |
| 欢迎页/设置网络提示 | ✅ |
| 周报模板 | ✅ |

---

## 你需在 Vercel / Sentry 完成（约 15 分钟）

1. **Sentry**：Production 设置 `VITE_SENTRY_DSN` → Redeploy → 浏览器 `throw new Error('sentry probe')` 验收  
2. **Cron**：确认项目有 `CRON_SECRET`（Vercel 自动生成）→ `npm run billing:verify-cron`  
3. **Deploy**：推送 `main` 后等 Vercel 完成

---

## 下一开发：v1.0.4

- 块级 Diff / hunk 接受（`diffHunkService` + Agent UI）
- 见 [ROADMAP_V1.0.3-V1.0.9.md](./ROADMAP_V1.0.3-V1.0.9.md) § v1.0.4

---

## 命令

```powershell
npm run test:local
npm run go-live:preflight
$env:APP_URL="https://ai-ide-flame.vercel.app"
$env:CRON_SECRET="<Vercel CRON_SECRET>"
npm run billing:verify-cron
```
