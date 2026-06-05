# Release Notes — v1.4.3 Tab++ spike

> **日期**：2026-06-05 · **上一版**：v1.4.2 · **类型**：patch · Tab++ POC

## 摘要

Tab++ **多行幽灵补全** spike：特性开关默认关，开启后 inline completion 使用跨行 ghost 布局。

## 交付

| 模块 | 说明 |
|------|------|
| `tabPlusPlusPoc.ts` | `VITE_TAB_PLUS_PLUS_POC` · session `ai-ide:feature:tabPlusPlusPoc` |
| `ghostLayoutEngine.ts` | 多行 indent 对齐 · 跨行 `Range` |
| `registerInlineCompletion.ts` | POC 开启时 `buildGhostInlineRange` |
| 设置 | Tab 指标卡 POC 徽章 `settings-tab-plus-plus-poc` |
| E2E | v14-features Tab++ POC 徽章用例 |

## 启用（仅实验）

```env
VITE_TAB_PLUS_PLUS_POC=true
```

或浏览器控制台：

```js
localStorage.setItem('ai-ide:feature:tabPlusPlusPoc', '1')
```

## 下一版

**v1.4.4** — AIDE Runtime RFC · `ADR_V1.5_AIDE_RUNTIME.md`

## 验证

```bash
npm run test:local
npm run test:e2e:local
```
