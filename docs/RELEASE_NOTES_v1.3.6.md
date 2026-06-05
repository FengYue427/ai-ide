# Release Notes — v1.3.6 Tab II + 导航 II

> **日期**：2026-06-05 · **合并发布**：v1.3.5 + v1.3.6 · **上一版**：v1.3.4

## v1.3.5 — Tab 补全 II

- Tab 指标卡完整 i18n（skipped · 失败原因 · FIM/平台/对话成功数）
- FIM 尝试与回退对话计数（`inlineCompletionMetrics`）
- `inlineCompletionPrefs` 边界单测

## v1.3.6 — 导航 II

- Python `resolvePythonReferences` · Shift+F12 跨文件引用
- 大纲侧栏切换文件 sticky cache
- TS 引用 E2E 列号 `4:10` 断言加固
- E2E `py-cross-file-navigation` 扩展 Shift+F12 用例

## 验证

```bash
npm run test:local
```
