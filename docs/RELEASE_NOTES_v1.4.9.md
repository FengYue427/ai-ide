# Release Notes — v1.4.9 v1.4 世代收官

> **日期**：2026-06-05 · **上一版**：v1.4.8 · **类型**：patch · 收官文档

## 摘要

**v1.4.x 最后一轮**：固化工程基线、竞品收官复评、smoke 周更 playbook，并 **拍板 v1.5.0 启动门**。无 v1.5 生产能力代码。

## 交付

| 文档 | 说明 |
|------|------|
| `V1.4.9_GA_EXECUTION.md` | 收官勾选清单 |
| `V1.4.9_SMOKE_WEEKLY.md` | 生产 smoke 周更（→ v1.5 GA） |
| `COMPETITOR_SCORE_V1.4.9.md` | 综合 **~3.40～3.44** |
| `V1.5_KICKOFF.md` | v1.5.0 编码门（评审定稿） |

## 工程基线

| 项 | 值 |
|----|-----|
| 单测 | **748+** |
| E2E | **53**（50 UI + 2 stack + 1 collab） |
| 预研 | Tab++ · hooks · Runtime · Activity **全部 ✅** |

## v1.5.0 启动条件

- v1.4.0～v1.4.9 tag ✅
- smoke **连续 2 周** 5/5（自本版部署日起算）
- `V1.5_KICKOFF` 评审 ✅

## 验证

```bash
npm run test:local
npm run test:e2e:local
npm run smoke:production -- https://ai-ide-flame.vercel.app
```
