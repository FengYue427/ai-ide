# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`，~320 keys）
- 运行时：`I18nProvider` + `useI18n().t(key, params?)`
- 语言存储：`unifiedStorage` key `language`，归一化见 `src/lib/language.ts`

## 已接入

| 批次 | 区域 | 文件 |
|------|------|------|
| 1 | 欢迎页、顶栏、登录、Chat 欢迎 | `WelcomeScreen`, `AppToolbar`, `AuthModal`, `ChatPanel` |
| 2 | 设置中心、订阅弹窗、命令面板 | `SettingsCenter`, `SubscriptionModal`, `CommandPalette` |
| 3 | MCP/规则、配额、侧栏、插件、空状态、反馈、确认/通知、Chat 主体 | `McpSettingsSection`, `ProjectRulesSection`, `QuotaIndicator`, `FileSidebar`, `PluginModal`, `PluginManager`, `EmptyState`, `FeedbackCenter`, `ChatPanel`, `PanelHost`, `AppShell`（工作区/测试通知） |

## 待接入（第四批）

- `AppShell` / `EditorLayout` 运行环境与终端按钮文案
- Hooks：`useEditorActions`, `useFileActions`, `useSessionGuard`, `WorkspaceManager` 等 toast
- Chat 系统提示与 workspace 服务生成的中文 prompt
- API 返回的套餐 `displayName`（服务端多语言或映射表）

## 验收

设置 → 外观 → **English** 后应切换为英文：

- 欢迎页、顶栏、登录、Chat 欢迎与输入区
- **设置中心** 五 Tab 与按钮
- **Ctrl+Shift+P** 命令面板
- **升级套餐** 弹窗（离线 fallback 套餐文案；在线 API 套餐仍可能为中文）
- MCP / 项目规则、插件管理、侧栏、配额条、空状态、反馈中心
- 登录/清数据/重置/工作区加载/自动保存等通知
