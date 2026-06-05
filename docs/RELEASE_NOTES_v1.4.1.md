# Release Notes — v1.4.1 v1.4.x 门禁

> **日期**：2026-06-05 · **上一版**：v1.4.0 · **类型**：patch · 基线复评

## 摘要

v1.4.0 大版本后的 **第一道 patch**：E2E 热修、工程基线固化、v1.4 竞品复评、v1.4.1～1.4.9 / v1.5 战略规划定稿。

## 交付

| 项 | 说明 |
|----|------|
| E2E | `v14-features` strict mode 修复（listitem 断言） |
| 竞品 | [COMPETITOR_SCORE_V1.4.md](./COMPETITOR_SCORE_V1.4.md) — 综合 **~3.35～3.40** |
| 规划 | [V1.4.x_MASTER_PLAN.md](./V1.4.x_MASTER_PLAN.md) · [ROADMAP_V1.4.x_PATCHES.md](./ROADMAP_V1.4.x_PATCHES.md)（1.4.1～1.4.9） |
| 战略 | [V1.5_STRATEGY_PIVOT.md](./V1.5_STRATEGY_PIVOT.md) · [AIDE_RUNTIME.md](./AIDE_RUNTIME.md) · [ROADMAP_V1.5.md](./ROADMAP_V1.5.md) |

## 工程基线

| 门禁 | 目标 |
|------|------|
| `test:local` | **712** |
| `test:e2e` UI | **44/44** |
| `test:e2e:stack` | **2/2** |
| `test:e2e:collab` | **1/1** |
| **E2E 合计** | **47** |

## 下一版

**v1.4.2** — Tab++ 技术 RFC：[V1.5_F1_TAB_PLUS_PLUS.md](./V1.5_F1_TAB_PLUS_PLUS.md)

**禁止**：宣传 · 上架 · Tab++ 生产代码（RFC 除外）

## 验证

```bash
npm run test:local
npm run test:e2e:local
```
