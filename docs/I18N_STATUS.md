# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`，~950 keys）
- 服务层：`src/lib/serviceI18n.ts` → `serviceText(key)`（跟随 `getApiLanguage()`）
- 运行时：`I18nProvider` + `useI18n().t(key, params?)`
- 非 React：`createTranslator(locale)`、`workspaceError()`、`pluginError()`、`localizeAuthApiError()`
- 服务端：`lib/i18n/apiMessages.ts` + `resolveRequestLocale(req)`（`X-App-Language` / `Accept-Language`）
- 客户端 API：`apiFetch` 自动附带 `X-App-Language`（`src/lib/apiLanguage.ts`）

## 已接入

| 批次 | 区域 |
|------|------|
| 1–5 | 欢迎/设置/Chat/插件/工作区/hooks/搜索/Git/导入等（见历史提交） |
| 6 | 审查/性能/终端/Agent 预览/Diff/拖放导入/内联 AI/预览/大纲/错误边界 |
| 7 | 协作/分享/支付/编辑器加载/主题/模板描述/工作区错误/配额格式/ModalShell |
| 8 | 套餐 API 展示名覆盖、计费说明、认证/插件/运行环境错误、工作区部分导入提示 |
| 9 | 服务端 API 错误本地化、插件市场目录文案、`X-App-Language` 请求头 |
| 10 | 插件沙箱/上下文错误、`formatFetchError`、默认 `index.js` 注释、示例插件 `context.locale` |
| 11 | 模板生成文件注释、`ai.provider.*` 名称/描述、AI 限流/取消错误、`applyTemplate(locale)` |
| 12 | 配额/工作区/MCP/审查/语义检索/提及上下文/插件权限/终端/Git 导入等服务层文案 |

组件/服务：`usageService`、`remoteWorkspaceService`、`cloudSyncService`、`mentionContextService`、`semanticSearchService`、`codeReviewService`、`mcpClientService`、`pluginPermissions`、`projectRulesService`

## 待接入

- 第三方插件作者自备 i18n（仅官方示例与内置插件覆盖）
- 服务端成功 `message` 字段全量本地化（可选）
- `formatService` / `aiService` API 状态英文错误（低优先级，多为技术信息）

## 验收

设置 → **English** 后：AI 配额用尽、工作区删除未登录、MCP 检测、代码审查快速检查、Chat @ 提及系统提示均为英文；新建 `.aide/rules.md` 模板为英文。
