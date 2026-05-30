import type { Language } from '../i18n/localeTables'
import { isSupportedLanguage } from '../i18n/localeTables'

export const DEFAULT_LANGUAGE: Language = 'zh-CN'

/** Map legacy storage values (zh/en/ja) to BCP-47 codes used by I18nProvider. */
export function normalizeLanguage(stored: string | null | undefined): Language {
  if (stored === 'en' || stored === 'en-US') return 'en-US'
  if (stored === 'ja' || stored === 'ja-JP') return 'ja-JP'
  if (stored === 'zh' || stored === 'zh-CN') return 'zh-CN'
  return 'zh-CN'
}

export function isLanguage(value: string): value is Language {
  return isSupportedLanguage(value)
}
