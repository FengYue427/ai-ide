# 是否现在正式上市？— 决策说明（2026-05-26）

## 结论（建议）

**可以上市**，建议采用 **「软 GA」**：代码与本地验收已满足 D3 产品面；用 **1～2 周** 完成生产商户 + Vercel 环境 + 法务主体后对外公告，而不是再等 IDE-4b。

| 维度 | 判断 |
|------|------|
| 产品与工程 | ✅ Agent、索引、Tab、订阅生命周期、`test:local` 197 绿 |
| 竞品定位 | ✅ ~2.35，够 D3「可付费」叙事，不需追平 Cursor |
| 商业化代码 | ✅ 支付宝链路 + 到期 Cron + 退款 SOP |
| **硬阻塞** | ⬜ **生产支付宝商户**、⬜ **付费页运营主体**、⬜ **Vercel Production env 审计** |
| 建议可选 | Sentry DSN、微信 live（可 GA 后补） |

**不建议**在尚未配置生产 `ALIPAY_APP_ID` 时对外写「已可付款」——会伤害信任。  
**建议**在 env 就绪后同一天：部署 → `check:release:d3` → 自己付 1 笔 ¥19 → 发公告。

---

## 软 GA vs 原 10～11 月计划

| | 原 PLAN_STRATEGY | 软 GA（现在） |
|--|------------------|---------------|
| 时间 | 2026-10～11 | **商户就绪后 1～2 周内** |
| 范围 | 同上 D3 | 同上，**不含** Electron |
| 风险 | 低（准备久） | 中（需 72h 支付值班） |
| 收益 | 晚收钱 | 早验证转化与 notify 稳定性 |

IDE-4b / IDE-5 **仍排在 GA 之后**，不塞进本次发布。

---

## Go / No-Go（发布当天早上勾）

**Go（全部 ✅ 才发公告）**

- [ ] Vercel Production：`ALIPAY_*` 生产、`ALIPAY_SANDBOX` 未设、`ALLOW_DEV_BILLING` 未设
- [ ] `APP_URL` = `https://ai-ide-flame.vercel.app`
- [ ] `BILLING_CRON_SECRET` 或 Vercel `CRON_SECRET`
- [ ] `npm run check:release:d3`（对本机 `.env.local` 模拟或 CI 读生产变量）
- [ ] 部署后 `APP_URL=... npm run smoke:report` → 5/5
- [ ] 创始人账号 **真实支付 ¥19** → 配额 5000/日
- [ ] `payment.html` 底部主体已填
- [ ] `VITE_GA_LIVE=true`（欢迎页显示「正式版」）

**No-Go（任一则延后公告）**

- notify 回调 502 / 付完未升级
- 生产仍显示「公测免费」且无支付宝按钮
- 法务主体空白仍对外收款（合规风险）

---

## 发布后 72 小时

见 [GA_LAUNCH_RUNBOOK.md](./GA_LAUNCH_RUNBOOK.md)。
