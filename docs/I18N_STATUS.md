# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`，~820 keys）
- 运行时：`I18nProvider` + `useI18n().t(key, params?)`
- 非 React：`createTranslator(locale)`、`workspaceError()`、`localizeAuthApiError()`
- 语言存储：`unifiedStorage` key `language`

## 已接入

| 批次 | 区域 |
|------|------|
| 1–5 | 欢迎/设置/Chat/插件/工作区/hooks/搜索/Git/导入等（见历史提交） |
| 6 | 审查/性能/终端/Agent 预览/Diff/拖放导入/内联 AI/预览/大纲/错误边界 |
| 7 | 协作/分享/支付/编辑器加载/主题/模板描述/工作区错误/配额格式/ModalShell |
| 8 | 套餐 API 展示名覆盖、计费说明、认证/插件/运行环境错误、工作区部分导入提示 |

组件：`SubscriptionModal`（`localizePlans` + 客户端 `buildSubscriptionPricingNote`）、`AuthModal`（API 错误映射）、`WorkspacePanel`（部分导入 toast）

服务：`authService`、`pluginService`（内置插件 + loadPlugin）、`pluginCatalogService`、`useWebContainer`、`usePluginHost`（语言切换重载内置插件）

## 待接入

- 服务端 API 错误正文（`lib/api/handlers/*`）需 `Accept-Language` 或错误码
- `templates/index.ts` 内嵌模板文件注释（非 UI）
- 插件市场目录 `tags` 与示例 manifest 文案

## 验收

设置 → 外观 → **English** 后检查：订阅弹窗套餐名/特性、公测与支付方式说明、登录失败提示、插件安装错误、内置插件工具栏标签、工作区拖放部分失败 toast。
