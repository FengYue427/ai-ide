# D3 GA 验收脚本（约 30 分钟 × 3 人）

> 生产收款前在 **沙箱 + 预发** 各跑一遍；GA 当日在 **生产** 再跑核心路径。  
> 自动化：`npm run d3:preflight` · 环境：`npm run check:release:billing`

---

## A. 自动化门禁（工程）

| # | 命令 | 通过标准 |
|---|------|----------|
| A1 | `npm run d3:preflight` | 无退出码 1 |
| A2 | `npm run smoke:report`（对生产 URL） | 5/5 或记录已知失败 |
| A3 | Vercel Production env | 无 `ALLOW_DEV_BILLING`、`ALIPAY_SANDBOX`、`VITE_ALLOW_OFFLINE_AUTH` |
| A4 | `BILLING_CRON_SECRET` + Cron `0 3 * * *` | `GET /api/billing/expire-subscriptions` 401 无 secret / 200 有 secret |

---

## B. 支付与订阅（产品 + 工程）

| # | 步骤 | 预期 |
|---|------|------|
| B1 | 新账号注册 → 打开「订阅」 | 显示价格；底部链到 `/legal/payment.html` |
| B2 | 购买专业版（沙箱或生产小额） | 订单成功 → 配额约 5000/日 |
| B3 | 「周期结束后取消」 | `cancelAtPeriodEnd=true`，到期前仍 Pro |
| B4 | 手动或 cron 触发到期 | 降为 free；Chat 出现订阅过期提示 |
| B5 | 恢复订阅（若未删行） | `resume` 成功 |
| B6 | 对账 | 按 [BILLING_RECONCILE_DAILY.md](./BILLING_RECONCILE_DAILY.md) 核对昨日订单 |
| B7 | 退款话术 | 客服可按 [BILLING_REFUND_SOP.md](./BILLING_REFUND_SOP.md) 闭环一例沙箱争议 |

---

## C. Agent 与本机工作区（4a 回归摘要）

见 [AGENT_REGRESSION_CHECKLIST.md](./AGENT_REGRESSION_CHECKLIST.md) 核心 8 项：

- 打开本机文件夹、@ 文件、工具 `write_file` 预览应用
- DeepSeek / OpenAI 工具轮无 400
- 配额耗尽有提示

---

## D. 合规

| # | 项 | 预期 |
|---|-----|------|
| D1 | `/legal/payment.html` 价格与 `plans.ts` / 结账一致 | ¥19 / ¥49 |
| D2 | 服务条款链接付费说明 | terms §订阅 |
| D3 | 运营主体信息 | GA 前法务填齐 payment 页底部 |

---

## E. 观测

| # | 项 | 预期 |
|---|-----|------|
| E1 | `VITE_SENTRY_DSN` 已配置 | 前端故意 `throw` 测试事件出现在 Sentry |
| E2 | `/api/health` | `database` 连通 |

---

## F. 发布

- [ ] `CHANGELOG` GA 段落
- [ ] Git tag（用户确认后）：`v1.0.0` 或约定版本
- [ ] 72h 值班：支付 notify、expire cron、Sentry P0

**签署**：产品 ___ · 工程 ___ · 日期 ___
