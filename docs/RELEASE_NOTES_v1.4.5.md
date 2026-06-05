# Release Notes — v1.4.5 hooks.yaml schema · 设置预览

> **日期**：2026-06-05 · **上一版**：v1.4.4 · **类型**：patch · Spec 工程

## 摘要

为 AIDE Runtime hooks 工件增加**轻量 YAML 解析/校验**与设置页 **Spec 目录只读预览**；不执行 hook。

## 交付

| 模块 | 说明 |
|------|------|
| `hooksSchema.ts` | `parseHooksYaml` · `hooksPathFromTasksPath` · 预览行格式化 |
| `specHooksPreview.ts` | 从 workspace 文件构建每 Spec 的 hooks 预览 |
| `SpecCatalogSection` | `data-testid="spec-hooks-preview-{specName}"` |
| i18n | `spec.catalog.hooksPreview` |

## 校验范围（v1 子集）

- `version: 1`
- `on`: `queue.before` · `queue.after` · `apply.after` · `verify.fail`
- `run`: `shell` · `agent` · `enqueue`（含必填字段）

## 下一版

**v1.4.6** — FIM middle 段 · Tab++ POC P95/debounce UX

## 验证

```bash
npm run test:local
npx playwright test e2e/runtime-hooks.spec.ts
```
