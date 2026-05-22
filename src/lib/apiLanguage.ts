import type { Language } from '../i18n'
import { normalizeLanguage } from './language'

let currentApiLanguage: Language = 'zh-CN'

export function setApiLanguage(language: Language): void {
  currentApiLanguage = language
}

export function getApiLanguage(): Language {
  return currentApiLanguage
}

/** Best-effort read before React hydrates I18nProvider. */
export function readStoredApiLanguage(): Language {
  if (typeof localStorage === 'undefined') return 'zh-CN'
  return normalizeLanguage(localStorage.getItem('language'))
}
