import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { normalizeLanguage } from '../lib/language'
import { readStoredApiLanguage, setApiLanguage } from '../lib/apiLanguage'
import { unifiedStorage, StorageLayer } from '../services/unifiedStorage'
import {
  translateKey,
  type Language,
  type TranslationKey,
} from './localeTables'

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
  const [language, setLanguageState] = useState<Language>(() => readStoredApiLanguage())

  useEffect(() => {
    unifiedStorage.get<string>(LANGUAGE_KEY, 'zh-CN').then((stored) => {
      const lang = normalizeLanguage(stored)
      setLanguageState(lang)
      setApiLanguage(lang)
    })
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    setApiLanguage(lang)
    unifiedStorage.set(LANGUAGE_KEY, lang, { layer: StorageLayer.LOCAL })
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string =>
      translateKey(language, key, params),
    [language],
  )

  const locale = language

  const contextValue = useMemo(
    () => ({ language, setLanguage, t, locale }),
    [language, setLanguage, t, locale],
  )

  return (
    <I18nContext.Provider value={contextValue}>
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
  return (key: TranslationKey, params?: Record<string, string | number>) =>
    translateKey(language, key, params)
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
      <option value="ja-JP">日本語</option>
    </select>
  )
}

/** Exposed for tests and coverage reports. */
export {
  getTranslationTable,
  auditPhase2JaCoverage,
  countJaOverrides,
  translateKey,
  JA_COVERAGE_TARGET_PCT,
} from './localeTables'
