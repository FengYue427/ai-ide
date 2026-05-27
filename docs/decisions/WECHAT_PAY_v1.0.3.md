# 决策记录 — 微信支付 v1.0.3

**日期**：2026-05-26 · **状态**：已采纳

---

## 背景

Phase 0 Kickoff 要求对微信 live 做 **接 or 文档说明** 决策。

---

## 决策

**v1.0.3 不启用微信支付 live**，对外以 **支付宝 Path B** 为主力国内收款渠道。

---

## 理由

1. 生产支付宝 Path B 已跑通，复验成本低于并行接微信商户。
2. 微信 Native 需额外商户号、证书与 notify 联调，与 1.0.3「稳定版封板、少扩 scope」冲突。
3. 代码骨架保留（`WECHAT_*` env、`wechat-sandbox-probe`），v1.1 可按需求启用。

---

## 对外说明

- [payment.html](../public/legal/payment.html)：微信支付标注为「商户开通后」。
- 订阅页 / FAQ：1.0.3 推荐 **支付宝**；微信敬请期待。

---

## 复评

v1.1 或用户 demand 显著时再开 Issue「WeChat Pay live」。
