# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`，~980 keys，两语言 key 对齐）
- 运行时：`I18nProvider` + `useI18n().t(key, params?)`
- 服务层：`src/lib/serviceI18n.ts` → `serviceText(key)`（跟随 `getApiLanguage()`）
- 非 React：`createTranslator`、`workspaceError()`、`pluginError()`、`localizeAuthApiError()`
- 插件作者：`manifest.i18n` + `context.t()` — 见 [PLUGIN_I18N.md](./PLUGIN_I18N.md)
- 服务端：`lib/i18n/apiMessages.ts` + `appendApiMessage` / `localizedSuccessResponse`
- 服务端：`resolveRequestLocale(req)`（`X-App-Language` / `Accept-Language`）
- 客户端 API：`apiFetch` 自动附带 `X-App-Language`；`pickApiResponseMessage`（`src/lib/apiUserMessage.ts`）

## 已接入（批次）

| 批次 | 区域 |
|------|------|
| 1–5 | 欢迎/设置/Chat/插件/工作区/hooks/搜索/Git/导入等 |
| 6 | 审查/性能/终端/Agent 预览/Diff/拖放导入/内联 AI/预览/大纲/错误边界 |
| 7 | 协作/分享/支付/编辑器加载/主题/模板描述/工作区错误/配额格式/ModalShell |
| 8 | 套餐 API 展示名覆盖、计费说明、认证/插件/运行环境错误、工作区部分导入提示 |
| 9 | 服务端 API 错误本地化、插件市场目录文案、`X-App-Language` 请求头 |
| 10 | 插件沙箱/上下文错误、`formatFetchError`、默认 `index.js` 注释、示例 `context.locale` |
| 11 | 模板生成文件注释、`ai.provider.*`、AI 限流/取消错误、`applyTemplate(locale)` |
| 12 | 配额/工作区/MCP/审查/语义检索/提及上下文/插件权限/终端/Git 导入等服务层文案 |
| 13 | `aiService` API 错误、工作区保存、Embedding/MCP、内置片段描述、Auth providers API |
| 14 | 第三方插件 `manifest.i18n` + `context.t()`（Worker 沙箱、校验、官方示例） |
| 15 | API 成功 `message` + `messageKey`、`pickApiResponseMessage` |
| 16 | 存储标签 `storageLabels`、`i18n-regression.test.ts`、冒烟清单 [I18N_SMOKE_CHECKLIST.md](./I18N_SMOKE_CHECKLIST.md) |

## UI 国际化结论

**用户可见 UI 与主要服务/API 错误、成功提示已双语覆盖。** 剩余为非 UI 或第三方协议字段（见下）。

## 待接入（低优先级）

| 项 | 说明 |
|----|------|
| `formatService` | 仅注释/控制台 |
| 微信 notify `message: 成功` | 支付网关协议回包，非 IDE UI |
| 列表类 GET | 无 `message` 字段（设计如此） |
| 第三方插件 | 作者自备 `manifest.i18n` |

## 测试

```bash
npm run test:local   # 含 src/i18n/i18n-regression.test.ts、pluginI18n、apiMessages、apiUserMessage
```

## 验收

人工清单：[I18N_SMOKE_CHECKLIST.md](./I18N_SMOKE_CHECKLIST.md)

快速检查：设置 → **English** → 启用 hello-sandbox / workspace-hints → 通知与弹窗为英文；AI 设置提供商描述为英文；默认 `index.js` 首行为 `// Welcome to AI IDE`。
