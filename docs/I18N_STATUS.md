# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`，~850 keys）
- 运行时：`I18nProvider` + `useI18n().t(key, params?)`
- 非 React：`createTranslator(locale)`、`workspaceError()`、`localizeAuthApiError()`
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

服务端：`lib/api/handlers/*` 认证/工作区/订阅/支付/用量等；`lib/api/workspacePayload.ts`

客户端：`PluginManager` 市场条目 name/desc/tags；`apiFetch` + `I18nProvider` 同步语言

## 待接入

- `templates/index.ts` 内嵌模板文件注释（非 UI）
- 示例插件 JSON 内 `source` 运行时文案（沙箱内硬编码）
- `formatFetchError` 等少量客户端网络兜底仍含中文

## 验收

设置 → 外观 → **English** 后：未登录访问需鉴权 API 应返回英文 `error`；插件市场卡片与标签为英文；忘记密码演示文案随语言变化。
