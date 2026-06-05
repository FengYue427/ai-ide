# Release Notes — v1.4.6 Tab++ 深化 I

> **日期**：2026-06-05 · **上一版**：v1.4.5 · **类型**：patch · Tab/FIM

## 摘要

Tab 补全支持 **FIM fill-in-middle**（有选区时拆分 prefix/middle/suffix）；Tab++ POC 模式下设置页展示 **P95 &lt; 400ms** 与 **debounce 280ms** 实验目标。

## 交付

| 模块 | 说明 |
|------|------|
| `fimMiddleSegment.ts` | 选区上下文拆分 · `buildChatFimPromptWithMiddle` |
| `registerInlineCompletion` | 传入 Monaco `getSelection` |
| `inlineCompletionService` | 请求 `middle` 字段 · 指标 `fimMiddleContexts` |
| `tabCompletionLatencyPercentile` | `getTabCompletionP95TargetMs()`（POC 400 / 默认 800） |
| `inlineCompletionPrefs` | POC 开启时默认 debounce 280ms |
| `SettingsTabCompletionCard` | POC 目标行（P95 · debounce） |

## 行为说明

- **无选区**：与 v1.4.0 一致，仅 prefix/suffix
- **有选区**：middle 进入 FIM prompt，指标计数 +1
- **POC 关**：P95 目标仍为 800ms，debounce 沿用生产/默认策略

## 下一版

**v1.4.7** — Spec 目录增强 · `runtime-state` 类型草案

## 验证

```bash
npm run test:local
npx playwright test e2e/v14-features.spec.ts
```
