import { createTranslator, type Language, type TranslationKey } from '../i18n'
import { getApiLanguage } from './apiLanguage'

/** Translate service-layer user-facing strings (follows UI language from I18nProvider). */
export function serviceText(
  key: TranslationKey,
  params?: Record<string, string | number>,
  locale?: Language,
): string {
  return createTranslator(locale ?? getApiLanguage())(key, params)
}
