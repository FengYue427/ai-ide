# v1.0.2.3 — Tab FIM 入门

## 交付

| ID | 内容 |
|----|------|
| 2.3-1 | 前缀+后缀多行补全；DeepSeek `beta/completions` FIM |
| 2.3-2 | `inlineCompletionService` 缓存 64、防抖 380ms |
| 2.3-3 | 设置 → **编辑器** → Tab AI 补全 / 最大行数 |
| 2.3-4 | 无 Key / 非 DeepSeek → 对话 prompt 回退，不抛错 |

## 使用

1. 配置 BYOK（DeepSeek 体验最佳）。
2. **设置中心 → 编辑器** 打开 Tab AI 补全，调整最大行数。
3. 在 Monaco 中停顿后接受内联灰色补全，或 `Ctrl+.` 触发建议项。

## 代码

- `src/lib/inlineCompletionPrefs.ts`
- `src/services/fimCompletionService.ts`
- `src/services/inlineCompletionService.ts`
- `src/editor/registerInlineCompletion.ts`
