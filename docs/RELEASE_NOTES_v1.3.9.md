# Release Notes — v1.3.9 v1.3 世代收官

> **日期**：2026-06-05 · **上一版**：v1.3.8 · **类型**：文档收官（Z1–Z5）

## v1.3 世代声明

**v1.3.0～v1.3.9 全部交付完成。** 本版无用户向大功能代码，专注：

- 生产 smoke **周更 playbook** 制度化（[V1.3.9_SMOKE_WEEKLY.md](./V1.3.9_SMOKE_WEEKLY.md)）
- E2E 基线固化：**42 UI + 2 stack + 1 collab**
- 竞品复评：综合 **~3.28～3.32**（[COMPETITOR_SCORE_V1.3.9.md](./COMPETITOR_SCORE_V1.3.9.md)）— **仍 &lt; 3.4**
- **v1.4 启动文档**：[V1.4_KICKOFF.md](./V1.4_KICKOFF.md) · [ROADMAP_V1.4.md](./ROADMAP_V1.4.md)

## 工程基线（v1.3.9 tag 时）

| 门禁 | 目标 |
|------|------|
| `test:local` | **701** 单测绿 |
| `test:e2e` | **42/42** UI |
| `test:e2e:stack` | **2/2** |
| `smoke:production` | **5/5** |

## v1.4 启动门

自 **v1.3.9 生产部署日**起：连续 **2 周** smoke 5/5 → 允许启动 **v1.4.0** 编码。

**禁止**：宣传 · 上架 · 在收官 patch 内写 v1.4 功能。

## 验证

```bash
npm run test:local
```
