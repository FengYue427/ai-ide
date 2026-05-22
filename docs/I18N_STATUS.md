# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`，~480 keys）
- 运行时：`I18nProvider` + `useI18n().t(key, params?)`
- 非 React：`createTranslator(locale)`（hooks、工作区 AI prompt）
- 语言存储：`unifiedStorage` key `language`，归一化见 `src/lib/language.ts`

## 已接入

| 批次 | 区域 | 文件 |
|------|------|------|
| 1 | 欢迎页、顶栏、登录、Chat 欢迎 | `WelcomeScreen`, `AppToolbar`, `AuthModal`, `ChatPanel` |
| 2 | 设置中心、订阅弹窗、命令面板 | `SettingsCenter`, `SubscriptionModal`, `CommandPalette` |
| 3 | MCP/规则、配额、侧栏、插件、空状态、反馈、确认/通知、Chat 主体 | `McpSettingsSection`, `ProjectRulesSection`, `QuotaIndicator`, `FileSidebar`, `PluginModal`, `PluginManager`, `EmptyState`, `FeedbackCenter`, `ChatPanel`, `PanelHost`, `AppShell` |
| 4 | 运行环境、编辑器栏、hooks toast、工作区管理/上下文、片段库、AI 工作区 prompt | `AppShell`, `EditorLayout`, `useEditorActions`, `useFileActions`, `useSessionGuard`, `useBillingReturn`, `WorkspaceManager`, `WorkspacePanel`, `SnippetLibrary`, `workspaceContextService` |

## 待接入（第五批及以后）

- `SearchPanel`, `GitPanel`, `AISettingsModal`, `TemplateModal`, `ImportModal`, `StatusBar` 等次要面板
- `generateCodePrompt`、语义搜索/审查等服务层中文
- API 返回的套餐 `displayName`（服务端多语言或映射表）
- 插件内置通知文案（第三方插件传入）

## 验收

设置 → 外观 → **English** 后应切换为英文：

- 欢迎页、顶栏、登录、Chat（含 Agent 工作区上下文 prompt）
- 设置中心、命令面板、升级套餐弹窗
- MCP / 规则、插件、侧栏、配额、空状态、反馈
- 运行状态、编辑器信息栏、文件/运行/订阅相关 toast
- 工作区管理、工作区上下文导入、代码片段库
