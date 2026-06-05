# Release Notes — v1.4.8 Activity Line RFC · orchestrator stub

> **日期**：2026-06-05 · **上一版**：v1.4.7 · **类型**：patch · Runtime stub

## 摘要

落地 **Activity Line** 线框、**runtimeEventBus** 与 **runtimeOrchestrator stub**；特性开关默认关，不接生产队列。

## 交付

| 模块 | 说明 |
|------|------|
| `runtimeEventBus.ts` | 五类事件 pub/sub（内存） |
| `runtimeOrchestrator.ts` | `enqueueRuntimeIntent` stub |
| `runtimeContextSnapshot.ts` | Tab++ 只读上下文草案 |
| `ActivityLine.tsx` | Chat 顶部可折叠活动条 |
| `aideRuntimeUi.ts` | `VITE_AIDE_RUNTIME_UI` / session flag |
| [ACTIVITY_LINE.md](./ACTIVITY_LINE.md) | RFC |

## 下一版

**v1.4.9** — v1.4 世代收官 · v1.5 启动门

## 验证

```bash
npm run test:local
npx playwright test e2e/activity-line.spec.ts
```
