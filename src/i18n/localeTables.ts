import { interpolate, translations, type TranslationKey } from './translations'
import { JA_JP_BULK_OVERRIDES } from './translationsJaBulk'
import { JA_JP_OVERRIDES } from './translationsJa'

/** UI locales shipped in the app (Phase 2 adds ja-JP skeleton). */
export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US', 'ja-JP'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export type { TranslationKey }

/** Minimum ja override coverage per prefix for F4 DoD. */
export const JA_COVERAGE_TARGET_PCT = 95

/** Phase 2 audit prefixes (settings / billing / agent-chat / collab). */
export const I18N_PHASE2_PREFIXES = [
  'settings.',
  'subscription.',
  'collab.',
  'auth.',
  'chat.',
  'agent.',
  'welcome.',
  'toolbar.',
  'command.',
  'git.',
  'debug.',
] as const

export interface LocalePrefixAuditRow {
  prefix: string
  totalKeys: number
  jaOverrides: number
  jaCoveragePct: number
}

const JA_JP_ALL_OVERRIDES: Partial<Record<TranslationKey, string>> = {
  ...JA_JP_BULK_OVERRIDES,
  ...JA_JP_OVERRIDES,
}

export function getTranslationTable(language: Language): Record<string, string> {
  if (language === 'zh-CN') return translations['zh-CN']
  if (language === 'en-US') return translations['en-US']
  return { ...translations['en-US'], ...JA_JP_ALL_OVERRIDES }
}

export function translateKey(
  language: Language,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const table = getTranslationTable(language)
  const raw = table[key] ?? translations['zh-CN'][key] ?? key
  return interpolate(raw, params)
}

export function countJaOverrides(): number {
  return Object.keys(JA_JP_ALL_OVERRIDES).length
}

/** Coverage of explicit ja overrides within Phase 2 prefixes (F3 audit). */
export function auditPhase2JaCoverage(): LocalePrefixAuditRow[] {
  const allKeys = Object.keys(translations['zh-CN']) as TranslationKey[]
  const jaKeys = new Set(Object.keys(JA_JP_ALL_OVERRIDES))

  return I18N_PHASE2_PREFIXES.map((prefix) => {
    const scoped = allKeys.filter((key) => key.startsWith(prefix))
    const jaOverrides = scoped.filter((key) => jaKeys.has(key)).length
    const totalKeys = scoped.length
    return {
      prefix,
      totalKeys,
      jaOverrides,
      jaCoveragePct: totalKeys === 0 ? 100 : Math.round((jaOverrides / totalKeys) * 100),
    }
  })
}

export function isSupportedLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}
