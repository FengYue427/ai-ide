# 当前执行清单（2026-05-26）— D3 GA + 新战略

> **Cursor 对比**：[COMPETITOR_SCORE_2026-05.md](./COMPETITOR_SCORE_2026-05.md)（**~2.35** vs Cursor **~3.6**）  
> **新方案**：[PLAN_STRATEGY_2026_Q3.md](./PLAN_STRATEGY_2026_Q3.md)  
> **GA 细则**：[PLAN_D3_GA_EXECUTION.md](./PLAN_D3_GA_EXECUTION.md)

---

## 战略摘要（一句话）

**加速 D3 正式上市**（见 [GA_LAUNCH_RUNBOOK.md](./GA_LAUNCH_RUNBOOK.md)）→ 再 **IDE-4b** → **IDE-5**。

---

## 门禁状态

| D3 门禁 | 状态 |
|---------|:----:|
| 体验 ≥2.2 | ✅ ~2.35 |
| 本地 QA | ✅ 你方已确认 |
| 支付生产闭环 | ⬜ Vercel 商户 |
| 付费合规终审 | 🔶 草案 OK，主体待填 |
| 运维 Sentry | 🔶 代码 OK，DSN 待配 |
| `test:local` | ✅ 197 tests |

---

## 三阶段（新方案）

| 阶段 | 时间 | 焦点 |
|------|------|------|
| **0 · D3 GA** | **现在（软 GA）** | 生产支付宝、法务主体、`VITE_GA_LIVE`、公告 |
| **1 · IDE-4b** | GA 后 0～4 月 | Electron + 本机终端 + 大仓索引 |
| **2 · IDE-5** | GA 后 4～9 月 | 块级 Diff、Tab FIM、工具 run_terminal |

GA **不包含** 4b/5。

---

## 接下来 4 周（P0）

| 周 | 任务 |
|----|------|
| **W1** | 提交支付宝**生产**商户；Vercel Production env（见 [DEPLOY_D3_GA.md](./DEPLOY_D3_GA.md)） |
| **W2** | `check:release:d3` 对 Production 绿；Sentry 测试事件 |
| **W3** | 法务填 `payment.html` 主体；[D3_GA_ACCEPTANCE.md](./D3_GA_ACCEPTANCE.md) 生产段 |
| **W4** | GA 公告草稿；定是否 **支付宝-only**；4b 可选 1 天 Electron POC |

---

## 已完成（近期）

| 项 | 状态 |
|----|:----:|
| IDE-4a + 本地验收 | ✅ |
| P4-1 索引 / P4-4 Tab | ✅ |
| W8 订阅 + W10 退款 SOP | ✅ |
| 付费页 + `d3:preflight` + test:local | ✅ |
| 竞品复评 ~2.35 + 战略文档 | ✅ |

---

## 命令

```powershell
cd c:\Users\18663\IDE\ai-ide
npm run test:local
npm run d3:preflight
npm run check:release:d3    # 需 Vercel Production 变量
npm run dev:stack           # 仅开发调试
```

---

## 待你确认的 4 个决策

见 [PLAN_STRATEGY_2026_Q3.md](./PLAN_STRATEGY_2026_Q3.md) §9：支付宝-only GA、GA 不含 Electron、GA 后优先 4b、GA+6 月目标分 ~2.75。
