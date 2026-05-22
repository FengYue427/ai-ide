# 国际化（i18n）状态

## 架构

- 词条：`src/i18n/translations.ts`（`zh-CN` / `en-US`）
- 运行时：`I18nProvider` + `useI18n().t(key, params?)`
- 语言存储：`unifiedStorage` key `language`，归一化见 `src/lib/language.ts`

## 已接入（第一批，2026-05）

| 区域 | 文件 |
|------|------|
| 欢迎页 | `WelcomeScreen.tsx` |
| 顶栏工具栏 | `AppToolbar.tsx` |
| 登录/注册 | `AuthModal.tsx` |
| Chat 欢迎与快捷动作 | `ChatPanel.tsx`（欢迎语） |

## 待接入（第二批建议）

- `SettingsCenter.tsx`
- `SubscriptionModal.tsx`
- `CommandPalette.tsx`
- `ChatPanel.tsx`（输入区、错误提示）
- `FeedbackCenter` / `notify` 文案

## 验收

设置 → 外观 → **English** 后，欢迎页与顶栏、登录弹窗、Chat 欢迎语应切换为英文。
