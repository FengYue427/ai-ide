import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

// 支持的语言
export type Language = 'zh-CN' | 'en-US'

// 翻译内容
const translations = {
  'zh-CN': {
    'app.name': 'AI IDE',
    'toolbar.run': '运行',
    'toolbar.search': '搜索',
    'toolbar.preview': '预览',
    'toolbar.collaboration': '协作',
    'toolbar.ai': 'AI',
    'sidebar.files': '文件',
    'editor.placeholder': '// 开始编写代码...',
    'ai.welcome': '你好！我是你的 AI 编程助手。',
    'common.save': '保存',
    'common.cancel': '取消',
  },
  'en-US': {
    'app.name': 'AI IDE',
    'toolbar.run': 'Run',
    'toolbar.search': 'Search',
    'toolbar.preview': 'Preview',
    'toolbar.collaboration': 'Collab',
    'toolbar.ai': 'AI',
    'sidebar.files': 'Files',
    'editor.placeholder': '// Start coding...',
    'ai.welcome': 'Hello! I am your AI coding assistant.',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
  }
} as const

type TranslationKey = keyof typeof translations['zh-CN']

// i18n Context
interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('ide-language') as Language
    return saved || 'zh-CN'
  })

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('ide-language', lang)
  }, [])

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key
  }, [language])

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

// 语言选择器组件
export function LanguageSelector() {
  const { language, setLanguage } = useI18n()

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      style={{
        padding: '4px 8px',
        fontSize: '12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        color: 'var(--text-primary)',
        cursor: 'pointer'
      }}
    >
      <option value="zh-CN">中文</option>
      <option value="en-US">English</option>
    </select>
  )
}
