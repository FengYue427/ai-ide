import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { normalizeLanguage } from '../lib/language'
import { unifiedStorage, StorageLayer } from '../services/unifiedStorage'
import {
  interpolate,
  translations,
  type Language,
  type TranslationKey,
} from './translations'

export type { Language, TranslationKey }

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  locale: string
}

const I18nContext = createContext<I18nContextType | null>(null)

const LANGUAGE_KEY = 'language'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh-CN')

  useEffect(() => {
    unifiedStorage.get<string>(LANGUAGE_KEY, 'zh-CN').then((stored) => {
      setLanguageState(normalizeLanguage(stored))
    })
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    unifiedStorage.set(LANGUAGE_KEY, lang, { layer: StorageLayer.LOCAL })
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const table = translations[language]
      const raw = table[key] ?? translations['zh-CN'][key] ?? key
      return interpolate(raw, params)
    },
    [language],
  )

  const locale = language

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, locale }}>
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

export type TranslateFn = I18nContextType['t']

/** Translate outside React (hooks, services) when UI locale is known. */
export function createTranslator(language: Language): TranslateFn {
  return (key: TranslationKey, params?: Record<string, string | number>) => {
    const table = translations[language]
    const raw = table[key] ?? translations['zh-CN'][key] ?? key
    return interpolate(raw, params)
  }
}

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
        cursor: 'pointer',
      }}
    >
      <option value="zh-CN">中文</option>
      <option value="en-US">English</option>
    </select>
  )
}
