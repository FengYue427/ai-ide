# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`，~880 keys）
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

组件/服务：`pluginContext`、`pluginSandbox`、`pluginSandboxRunner`、`apiUtils.formatFetchError`、`ideStore` 默认文件

示例：`examples/hello.plugin.json`、`examples/plugins/workspace-hints.plugin.json` 按 `context.locale` 双语

## 待接入

- `templates/index.ts` 内嵌模板**文件内容**注释（生成代码中的注释，非 UI 文案）
- `aiService` 模型描述等设置页展示（低优先级）
- 第三方插件作者自备 i18n（仅官方示例与内置插件覆盖）

## 验收

设置 → **English** 后：安装并启用 hello-sandbox / workspace-hints，通知与弹窗为英文；新建工作区默认 `index.js` 首行为 `// Welcome to AI IDE`。
