# 当前执行入口

> **更新**：2026-06-05 — **v1.5.0 F0–F8 ✅** · v1.5 世代闭环 · 待发 tag

---

## 策略

- **零宣传 / 不上架**（至单独决策）
- **v1.5 三轨已全部交付**：F0 平台模型 · F1–F2 Tab++ · F3–F6 Runtime · F7 GA · **F8 评分**
- **综合分**：**~3.50～3.52** — [COMPETITOR_SCORE_V1.5.md](./COMPETITOR_SCORE_V1.5.md)

**GA 清单**：[V1.5_GA_EXECUTION.md](./V1.5_GA_EXECUTION.md) · **环境**：[V1.5_ENV.md](./V1.5_ENV.md)

---

## 当前：v1.5.0 发版门（仅剩运维）

| 条件 | 状态 |
|------|:----:|
| F0–F8 代码 + 文档 | ✅ |
| 单测 **789+** · E2E **64** | ✅ |
| Tag `v1.5.0` + push | ☐ 发版日 |
| 生产 smoke 5/5 | ☐ 发版日 |
| Vercel v1.5 env + Stripe/支付宝 Price | ☐ 运维 |

---

## 下一世代：v1.6

| 优先级 | 主题 |
|:------:|------|
| **P0** | Tab++ prod 默认开 · 支付生产 |
| P1 | 云 Agent MVP · Runtime 抛光 · Electron 深化 |

**Kickoff**：[V1.6_KICKOFF.md](./V1.6_KICKOFF.md) · [ROADMAP_V1.6.md](./ROADMAP_V1.6.md)

---

## 门禁

```bash
npm run test:local
npm run test:e2e:local
npm run smoke:production -- https://ai-ide-flame.vercel.app
```
