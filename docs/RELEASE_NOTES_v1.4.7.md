# Release Notes — v1.4.7 Runtime 深化 I

> **日期**：2026-06-05 · **上一版**：v1.4.6 · **类型**：patch · Spec 工程

## 摘要

冻结 **`runtime-state.json`** 类型与解析器，并在设置页 Spec 目录提供**运行态只读预览**与**执行状态徽章**；不持久化写入。

## 交付

| 模块 | 说明 |
|------|------|
| `runtimeState.ts` | ADR D5 解析 · `deriveSpecExecutionStatus` |
| `runtimeStatePreview.ts` | 从 workspace 构建摘要行 |
| `SpecCatalogSection` | `spec-runtime-state-summary` · `spec-status-badge-{name}` |
| i18n | 运行态摘要 · 四种执行状态 |

## Schema（v1 只读子集）

- 路径：`.aide/meta/runtime-state.json`
- 字段：`activeSpecPath` · `queueSnapshot` · `lastHookResults` · `updatedAt`

## 下一版

**v1.4.8** — Activity Line RFC · `runtimeOrchestrator` 接口 stub

## 验证

```bash
npm run test:local
npx playwright test e2e/runtime-state.spec.ts
```
