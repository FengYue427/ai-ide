# Release Notes — v1.5.8 · E2E 回归 · i18n

> **Tag**：含于 **v1.5.9** 合并发布

## 北极星

门禁 **只增不减** — 单测 ≥800 · E2E ≥64 · 无 P0 回归。

## 交付

| 项 | 说明 |
|----|------|
| **`verify:release:gates`** | 静态统计 unit/E2E 声明数 |
| **`releaseGates.ts`** | 基线常量 + 单测 |
| **i18n** | `SpecsSection` · Spec 目录 meta 文案 |
| **E2E** | `v158-regression.spec.ts`（+3） |
| **i18n-regression** | spec.workflow · hooksGuide 用例 |

## 门禁

```bash
npm run verify:release:gates
npm run test:unit
```

## 下一 patch

**v1.5.9** — 见 [RELEASE_NOTES_v1.5.9.md](./RELEASE_NOTES_v1.5.9.md)
