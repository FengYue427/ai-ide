import { createTranslator, type Language, type TranslationKey } from '../i18n'
import { normalizeLanguage } from '../lib/language'

export function getWorkspaceLocale(): Language {
  if (typeof localStorage === 'undefined') return 'zh-CN'
  return normalizeLanguage(localStorage.getItem('language') ?? 'zh-CN')
}

export function workspaceError(
  key: TranslationKey,
  params?: Record<string, string | number>,
  locale?: Language,
): string {
  return createTranslator(locale ?? getWorkspaceLocale())(key, params)
}
