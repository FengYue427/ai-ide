import { describe, expect, it } from 'vitest'
import { translations, type TranslationKey } from './translations'
import { JA_JP_BULK_OVERRIDES } from './translationsJaBulk'
import { JA_JP_OVERRIDES } from './translationsJa'
import { translateKey } from './localeTables'

/** Keys shown in Debug panel, command palette, and bottom tab. */
export const DEBUG_UI_KEY_PREFIXES = [
  'debug.',
  'bottomPanel.tab.debug',
  'panel.debug.',
  'command.debug',
  'command.cat.debug',
] as const

export function listDebugUiTranslationKeys(): TranslationKey[] {
  const zhKeys = Object.keys(translations['zh-CN']) as TranslationKey[]
  return zhKeys.filter((key) =>
    DEBUG_UI_KEY_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix)),
  )
}

const jaAll: Partial<Record<TranslationKey, string>> = {
  ...JA_JP_BULK_OVERRIDES,
  ...JA_JP_OVERRIDES,
}

describe('Debug UI ja-JP (1.1.7.4 F5)', () => {
  it('lists every debug-adjacent UI key', () => {
    const keys = listDebugUiTranslationKeys()
    expect(keys.length).toBeGreaterThanOrEqual(55)
    expect(keys).toContain('command.debug.start')
    expect(keys).toContain('bottomPanel.tab.debug')
    expect(keys).toContain('panel.debug.subtitle')
  })

  it('has explicit ja overrides for all debug-adjacent keys', () => {
    for (const key of listDebugUiTranslationKeys()) {
      expect(jaAll[key], key).toBeTruthy()
    }
  })

  it('renders Japanese for command palette and debug panel strings', () => {
    expect(translateKey('ja-JP', 'command.debug.start')).toMatch(/デバッグ/)
    expect(translateKey('ja-JP', 'command.cat.debug')).toMatch(/デバッグ/)
    expect(translateKey('ja-JP', 'debug.callStackTitle')).toMatch(/コールスタック/)
    expect(translateKey('ja-JP', 'debug.continue')).toMatch(/続行/)
    expect(translateKey('ja-JP', 'debug.viewerBlockedTitle')).toMatch(/Viewer/)
  })
})
