# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`，~200 keys）
- 运行时：`I18nProvider` + `useI18n().t(key, params?)`
- 语言存储：`unifiedStorage` key `language`，归一化见 `src/lib/language.ts`

## 已接入

| 批次 | 区域 | 文件 |
|------|------|------|
| 1 | 欢迎页、顶栏、登录、Chat 欢迎 | `WelcomeScreen`, `AppToolbar`, `AuthModal`, `ChatPanel` |
| 2 | 设置中心、订阅弹窗、命令面板 | `SettingsCenter`, `SubscriptionModal`, `CommandPalette` |

## 待接入（第三批）

- `McpSettingsSection` / `ProjectRulesSection`
- `ChatPanel` 输入区与错误提示
- `FeedbackCenter` / `notify` 文案
- `PluginManager`、侧栏文件树
- API 返回的套餐 `displayName`（服务端多语言或映射表）

## 验收

设置 → 外观 → **English** 后应切换为英文：

- 欢迎页、顶栏、登录、Chat 欢迎
- **设置中心** 五 Tab 与按钮
- **Ctrl+Shift+P** 命令面板
- **升级套餐** 弹窗（离线 fallback 套餐文案；在线 API 套餐仍可能为中文）
