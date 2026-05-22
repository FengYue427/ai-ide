# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`，~580 keys）
- 运行时：`I18nProvider` + `useI18n().t(key, params?)`
- 非 React：`createTranslator(locale)`（hooks、AI prompt、`generateCodePrompt`）
- 语言存储：`unifiedStorage` key `language`，归一化见 `src/lib/language.ts`

## 已接入

| 批次 | 区域 | 文件 |
|------|------|------|
| 1–4 | 见历史批次 | 欢迎页、设置、Chat、插件、工作区、hooks 等 |
| 5 | 搜索、Git、AI 设置、模板/导入、状态栏、右侧面板、代码 prompt | `SearchPanel`, `GitPanel`, `AISettingsModal`, `TemplateModal`, `ImportModal`, `StatusBar`, `RightPanel`, `aiService.generateCodePrompt` |

## 待接入

- `CodeReviewPanel`, `PerformancePanel`, `Terminal`, `DropZone`, `AgentApplyModal`, `CollaborationPanel`
- `workspaceContextService` 抛出的错误文案（按 locale 映射）
- 模板/套餐目录中的中文 `name`/`description`（`templates/index.ts`、API `displayName`）
- 插件内置通知

## 验收

设置 → 外观 → **English** 后应切换为英文：

- 全局搜索面板（Ctrl+Shift+F）、Git 侧栏、底部状态栏
- AI 模型设置、项目模板、导入项目弹窗
- 非 Agent 模式下快捷动作的 AI 系统 prompt（explain/refactor 等）
