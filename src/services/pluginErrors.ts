import { createTranslator, type Language, type TranslationKey } from '../i18n'
import { getWorkspaceLocale } from './workspaceErrors'

export function pluginError(
  key: TranslationKey,
  params?: Record<string, string | number>,
  locale?: Language,
): string {
  return createTranslator(locale ?? getWorkspaceLocale())(key, params)
}
