# GA / 稳定版 上市后 72 小时值班

> **站点**：https://ai-ide-flame.vercel.app · **当前规划**：**v1.0.3 稳定版**  
> **Phase 1 运维**：[V1.0.3_PHASE1_OPS.md](./V1.0.3_PHASE1_OPS.md) · **清单**：[GO_LIVE_NOW.md](./GO_LIVE_NOW.md)

---

## 发布前（1.0.3 GA）

```powershell
npm run ops:verify-p1
# Vercel 填 VITE_SENTRY_DSN → 部署 → Sentry 测试事件 ai-ide@1.0.3
```

---

## D0（发布当天）

- [ ] 发公告（GitHub Discussions / [publish/](./publish/)）
- [ ] Vercel **Logs** 过滤 `payment/alipay/notify` — 无连续 5xx
- [ ] `npm run ops:verify-p1` 或 `smoke:report` → **5/5**
- [ ] `payment.html` 运营主体与版本行已更新

## D1

- [ ] [BILLING_RECONCILE_DAILY.md](./BILLING_RECONCILE_DAILY.md) — 核对昨日订单
- [ ] Sentry Issues（若已配 DSN）
- [ ] 收集首条用户反馈 / 支付失败 Issue

## D2～D3

- [ ] Cron：`npm run billing:verify-cron`（需 `CRON_SECRET`）
- [ ] Vercel Cron 页无 401
- [ ] 复盘：注册数、付费笔数、notify 失败次数

## 常态化（每周，1.0.3 Phase 1 起）

| 频率 | 动作 |
|------|------|
| 每周 | `npm run ops:verify-p1`（或至少 `smoke:report`） |
| 每周 | `billing:verify-cron`（secret 从 Vercel 复制，**勿提交**） |
| 每月 | 核对 [V1.0.3_VERCEL_ENV.md](./V1.0.3_VERCEL_ENV.md) |

---

## 事故回滚

1. Vercel → Deployments → 上一稳定版 **Promote to Production**  
2. 临时去掉 Production 的 `ALIPAY_APP_ID`（回到 Path A 公测文案）  
3. Issues 公告说明维护窗口
