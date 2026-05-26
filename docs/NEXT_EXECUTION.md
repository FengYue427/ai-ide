# 当前执行清单 — **可上线**（2026-05-26）

> **上线清单**：[GO_LIVE_NOW.md](./GO_LIVE_NOW.md)  
> **站点**：https://ai-ide-flame.vercel.app  
> **桌面**：https://github.com/FengYue427/ai-ide/releases/latest

---

## 上线门禁

| 门禁 | 状态 |
|------|:----:|
| 生产 smoke 5/5 | ✅ [PRODUCTION_SMOKE_LAST.md](./PRODUCTION_SMOKE_LAST.md) |
| 生产支付宝 Path B | ✅ `alipay=true` |
| 本地集成 22/22 | ✅ |
| Vercel 最新部署 | ✅ `314ce6c` 已触发 |
| 桌面 Release v1.0.1+ | ✅ portable + setup |
| **对外公告** | ⬜ **发 [GA_ANNOUNCEMENT.md](./GA_ANNOUNCEMENT.md)** |
| `payment.html` 主体 | 🔶 法务 |
| Sentry DSN | 🔶 建议 |

**结论：Web + 桌面渠道均可对外；剩公告与合规补强。**

---

## 今天（上线日）

1. **发公告** — [GA_ANNOUNCEMENT.md](./GA_ANNOUNCEMENT.md) 短版  
2. **72h 值班** — [GA_POST_LAUNCH_72H.md](./GA_POST_LAUNCH_72H.md)  
3. Vercel Deployments 确认 **Ready**

---

## 接下来（P1）

| 任务 |
|------|
| `payment.html` 运营主体 |
| Sentry + 测试事件 |
| [BILLING_RECONCILE_DAILY.md](./BILLING_RECONCILE_DAILY.md) |
| IDE-4b 真机验收 [PHASE_IDE4B.md](./PHASE_IDE4B.md) |
| IDE-5-1 块级 Diff [PLAN_IDE5_AND_COMPETITORS.md](./PLAN_IDE5_AND_COMPETITORS.md) |

---

## 命令

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run go-live:preflight   # test:local + smoke:report
npm run billing:reconcile
npm run electron:pack
```
