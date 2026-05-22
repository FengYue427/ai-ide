import type { Language } from '../i18n'
import { interpolate } from '../i18n/translations'
import { pluginError } from './pluginErrors'
import type { PluginI18nTable } from './pluginTypes'

const SUPPORTED_LOCALES: Language[] = ['zh-CN', 'en-US']
const MAX_KEYS_PER_LOCALE = 64
const MAX_VALUE_LENGTH = 512
const MAX_TOTAL_CHARS = 8_192

const KEY_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/

function countChars(table: PluginI18nTable | undefined): number {
  if (!table) return 0
  let total = 0
  for (const locale of SUPPORTED_LOCALES) {
    const entries = table[locale]
    if (!entries) continue
    for (const value of Object.values(entries)) {
      total += value.length
    }
  }
  return total
}

/** Validate optional manifest.i18n (returns localized error string or null). */
export function validatePluginI18n(i18n: unknown): string | null {
  if (i18n === undefined || i18n === null) return null
  if (typeof i18n !== 'object' || Array.isArray(i18n)) {
    return pluginError('plugin.i18n.invalidShape')
  }

  const table = i18n as Record<string, unknown>
  const locales = Object.keys(table)
  if (locales.length === 0) return null

  for (const locale of locales) {
    if (!SUPPORTED_LOCALES.includes(locale as Language)) {
      return pluginError('plugin.i18n.unsupportedLocale', { locale })
    }
    const entries = table[locale]
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
      return pluginError('plugin.i18n.invalidShape')
    }
    const keys = Object.keys(entries as Record<string, unknown>)
    if (keys.length > MAX_KEYS_PER_LOCALE) {
      return pluginError('plugin.i18n.tooManyKeys', { locale, max: MAX_KEYS_PER_LOCALE })
    }
    for (const key of keys) {
      if (!KEY_PATTERN.test(key)) {
        return pluginError('plugin.i18n.invalidKey', { key })
      }
      const value = (entries as Record<string, unknown>)[key]
      if (typeof value !== 'string') {
        return pluginError('plugin.i18n.invalidValue', { key })
      }
      if (value.length > MAX_VALUE_LENGTH) {
        return pluginError('plugin.i18n.valueTooLong', { key, max: MAX_VALUE_LENGTH })
      }
    }
  }

  if (countChars(table as PluginI18nTable) > MAX_TOTAL_CHARS) {
    return pluginError('plugin.i18n.totalTooLarge', { max: MAX_TOTAL_CHARS })
  }

  return null
}

/** Compact tables for Worker embedding (zh-CN + en-US only). */
export function normalizePluginI18n(i18n: PluginI18nTable | undefined): Record<Language, Record<string, string>> {
  const out: Record<Language, Record<string, string>> = { 'zh-CN': {}, 'en-US': {} }
  if (!i18n) return out
  for (const locale of SUPPORTED_LOCALES) {
    const entries = i18n[locale]
    if (!entries) continue
    out[locale] = { ...entries }
  }
  return out
}

export function createPluginTranslator(
  i18n: PluginI18nTable | undefined,
  locale: Language,
): (key: string, params?: Record<string, string | number>) => string {
  const tables = normalizePluginI18n(i18n)
  return (key, params) => {
    const raw = tables[locale]?.[key] ?? tables['zh-CN']?.[key] ?? key
    return interpolate(raw, params)
  }
}
