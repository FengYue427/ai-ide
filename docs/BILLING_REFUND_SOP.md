# 退款与争议处理 SOP（D3 · 1 页）

> **适用**：支付宝/微信生产订单 · 人工处理 · **7 个工作日内首次回复**（目标）  
> **关联**：[LEGAL_D3_PAYMENT_APPENDIX.md](./LEGAL_D3_PAYMENT_APPENDIX.md) · [BILLING_RECONCILE_DAILY.md](./BILLING_RECONCILE_DAILY.md)

---

## 1. 受理渠道

| 渠道 | 动作 |
|------|------|
| GitHub Issues | 标签 `billing-refund`，收集邮箱 + 订单号 |
| 客服邮箱 | 【待运营填写】 |
| 站内 | 订阅弹窗 → [付费说明](/legal/payment.html) 中的联系方式 |

**必填信息**：注册邮箱、商户订单号（`out_trade_no` / 支付宝交易号）、付款时间、诉求（重复扣款 / 未到账 / 误购等）。

---

## 2. 分类与处理

| 类型 | 核实 | 处理 |
|------|------|------|
| **重复扣款** | `PaymentOrder` 表 + 支付宝对账 | 多余一笔走渠道退款；保留一笔权益 |
| **已付未开通** | `npm run billing:reconcile` 或 `POST` 补单 | `fulfillPaymentOrder` 补权益；仍失败则人工 `upsert` + 致歉 |
| **误购 / 7 天内** | 登录日志、AI 使用量 | 未重度使用可部分退款（运营裁量）；已大量使用原则上不退 |
| **周期结束后仍扣款** | 产品为单次购买 | 说明无自动续费；若渠道误扣按重复扣款处理 |
| **发票** | 订单与抬头 | 登记台账，财务 15 个工作日内开具（待流程） |

---

## 3. 操作步骤（工程）

1. **查单**  
   ```bash
   npm run admin:lookup -- user@example.com
   ```
2. **对账**  
   ```bash
   npm run billing:reconcile -- --out-trade-no aide_xxx
   ```
3. **降级 / 取消**（用户要求终止服务）  
   - 应用内：订阅 →「周期结束后取消」或「立即降级」  
   - 库表：`cancelAtPeriodEnd` 或 `downgradeUserToFree`（仅运维、记审计日志）
4. **退款**  
   - 在支付宝商户后台发起退款，备注 `out_trade_no`  
   - Issues 回复：退款金额、预计到账（1～7 工作日）
5. **结案**  
   - 更新 Issue；Sentry/日志如有支付异常一并关闭

---

## 4. 禁止事项

- 生产库勿直接删用户；勿改 `AUTH_SECRET` 做「退款」  
- 勿在未核实前承诺「全额退」  
- 沙箱订单不对用户承诺真实退款

---

## 5. 升级

| 条件 | 升级对象 |
|------|----------|
| 单笔 ≥ ¥500 或争议超 7 日 | 产品负责人 |
| 批量异常（同日 ≥3 笔未到账） | 工程 on-call + 暂停新购（可选） |

---

## 6. 记录模板（粘贴到 Issue）

```text
订单: out_trade_no=
渠道: 支付宝 / 微信
核实: [对账截图 / DB 状态]
结论: 补单 / 退款 ¥ / 驳回（说明）
操作人: 
日期:
```
