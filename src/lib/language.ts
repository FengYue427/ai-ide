import type { Language } from '../i18n'

export const DEFAULT_LANGUAGE: Language = 'zh-CN'

/** Map legacy storage values (zh/en) to BCP-47 codes used by I18nProvider. */
export function normalizeLanguage(stored: string | null | undefined): Language {
  if (stored === 'en' || stored === 'en-US') return 'en-US'
  return 'zh-CN'
}

export function isLanguage(value: string): value is Language {
  return value === 'zh-CN' || value === 'en-US'
}
