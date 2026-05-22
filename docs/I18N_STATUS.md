# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`，~680 keys）
- 运行时：`I18nProvider` + `useI18n().t(key, params?)`
- 非 React：`createTranslator(locale)`
- 语言存储：`unifiedStorage` key `language`

## 已接入

| 批次 | 区域 |
|------|------|
| 1–5 | 欢迎/设置/Chat/插件/工作区/hooks/搜索/Git/导入等（见历史提交） |
| 6 | 审查/性能/终端/Agent 预览/Diff/拖放导入/内联 AI/预览/大纲/错误边界 |

组件：`CodeReviewPanel`, `PerformancePanel`, `Terminal`, `AgentApplyModal`, `DiffViewer`, `DropZone`, `InlineAIEdit`, `PreviewPanel`, `SymbolOutline`, `ErrorBoundary`

## 待接入

- `CollaborationPanel`, `ShareModal`, `CnPayModal`, `Editor` 内联提示
- `templates/index.ts` 模板名称与描述
- API 套餐 `displayName`、插件通知文案
- `workspaceContextService` 错误消息（按 locale）

## 验收

设置 → 外观 → **English** 后检查：代码审查侧栏、性能面板、终端、Agent 变更预览、文件拖放导入、编辑器内联 AI、预览面板、符号大纲。
