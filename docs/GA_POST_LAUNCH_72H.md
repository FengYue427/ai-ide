# GA 上市后 72 小时值班

> **站点**：https://ai-ide-flame.vercel.app · **版本**：v1.0.2（Web GA + 桌面可选）  
> **支付**：支付宝生产 Path B · **清单**：[GO_LIVE_NOW.md](./GO_LIVE_NOW.md)

---

## D0（发布当天）

- [ ] 发公告（[GA_ANNOUNCEMENT.md](./GA_ANNOUNCEMENT.md) 短版 → GitHub Discussions / Issues 置顶）
- [ ] 掘金 / V2EX（[docs/publish/](./publish/) 复制粘贴发布）
- [ ] Vercel **Logs** 过滤 `payment/alipay/notify` — 无连续 5xx
- [ ] 自测账号配额仍为 Pro（5000/日 量级）
- [ ] `payment.html` 运营主体是否已填（未填则尽快补）

## D1

- [ ] [BILLING_RECONCILE_DAILY.md](./BILLING_RECONCILE_DAILY.md) — 核对昨日订单与支付宝账单
- [ ] Sentry（若已配 DSN）看新增 Issues
- [ ] 收集首条用户反馈 / 支付失败 Issue

## D2～D3

- [ ] Cron：`/api/billing/expire-subscriptions` 在 Vercel Cron 执行无 401（**Cron** 页）
- [ ] 复盘：注册数、付费笔数、notify 失败次数
- [ ] 定 IDE-4b 启动周（见 [PLAN_STRATEGY_2026_Q3.md](./PLAN_STRATEGY_2026_Q3.md)）

## 事故回滚

1. Vercel → Deployments → 上一稳定版 **Promote to Production**  
2. 临时去掉 Production 的 `ALIPAY_APP_ID`（回到 Path A 公测文案）  
3. Issues 公告说明维护窗口
