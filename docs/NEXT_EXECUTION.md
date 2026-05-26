# 当前执行清单（2026-05-26）— v1.0.0 GA 已上线

> **站点**：https://ai-ide-flame.vercel.app  
> **战略**：GA 后 → [PLAN_STRATEGY_2026_Q3.md](./PLAN_STRATEGY_2026_Q3.md)（IDE-4b 桌面版优先）

---

## D3 GA 门禁（更新）

| 门禁 | 状态 |
|------|:----:|
| 体验 ≥2.2 | ✅ |
| 生产支付 Path B + 真单 | ✅ **你已验收** |
| 代码部署 | ✅ |
| 付费合规主体 | 🔶 `payment.html` 待法务填齐 |
| Sentry 生产 | 🔶 建议补 `VITE_SENTRY_DSN` |
| GA 对外公告 | ⬜ 见下方「今天」 |

---

## 今天（发布后）

1. **发公告** — 复制 [GA_ANNOUNCEMENT.md](./GA_ANNOUNCEMENT.md) 短版 → GitHub Issues / 社群  
2. **72h 值班** — [GA_POST_LAUNCH_72H.md](./GA_POST_LAUNCH_72H.md)  
3. **（可选）** GitHub Release `v1.0.0` + `git tag v1.0.0`（仓库已 bump `package.json`）

---

## 接下来 2～4 周（P1）

| 优先级 | 任务 |
|:------:|------|
| P1 | 填 `payment.html` 运营主体；Sentry DSN + 测试事件 |
| P1 | 每日 [BILLING_RECONCILE_DAILY.md](./BILLING_RECONCILE_DAILY.md)（有订单后） |
| P2 | 国内访问：考虑**自定义域名**（`vercel.app` 在部分网络不稳） |
| P2 | **IDE-4b** Electron POC（1～2 天）→ 排期桌面版 |

---

## 已完成里程碑

| 里程碑 | 日期 |
|--------|------|
| IDE-4a + 本地 QA | 2026-05 |
| 代码 push `main` | 2026-05-26 |
| **生产支付宝收款验收** | **2026-05-26** ✅ |
| **v1.0.0 GA** | **2026-05-26** |

---

## 命令

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run billing:reconcile    # 对账（需 DATABASE_URL）
npm run test:local
```
