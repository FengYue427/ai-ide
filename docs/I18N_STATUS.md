# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`，~780 keys）
- 运行时：`I18nProvider` + `useI18n().t(key, params?)`
- 非 React：`createTranslator(locale)`、`workspaceError()`（`src/services/workspaceErrors.ts`）
- 语言存储：`unifiedStorage` key `language`

## 已接入

| 批次 | 区域 |
|------|------|
| 1–5 | 欢迎/设置/Chat/插件/工作区/hooks/搜索/Git/导入等（见历史提交） |
| 6 | 审查/性能/终端/Agent 预览/Diff/拖放导入/内联 AI/预览/大纲/错误边界 |
| 7 | 协作/分享/支付/编辑器加载/主题/模板描述/工作区错误/配额格式/ModalShell |

组件：`CollaborationPanel`, `ShareModal`, `CnPayModal`, `Editor`, `SkeletonLoader`, `ThemeSelector`, `TemplateModal`, `ModalShell`, `QuotaIndicator`（`formatQuotaLabel` + `t`）

服务：`workspaceContextService` 抛错与默认工作区名、`quotaDisplay.formatQuotaLabel`

## 待接入

- API 套餐 `displayName`、插件通知文案
- `templates/index.ts` 内嵌模板文件注释（非 UI）
- `ChatPanel` 中文文件名解析正则（解析用，非展示）
- `WorkspacePanel` `console.warn` 文案

## 验收

设置 → 外观 → **English** 后检查：协作面板、分享/导入、国内支付、Monaco 加载与错误态、主题选择器、模板卡片描述、配额指示器、工作区导入超限提示。
