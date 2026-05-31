import { describe, expect, it } from 'vitest'
import { translations, type TranslationKey } from './translations'
import { JA_JP_BULK_OVERRIDES } from './translationsJaBulk'
import { JA_JP_OVERRIDES } from './translationsJa'
import { translateKey } from './localeTables'

/** Keys shown in Git panel, empty state, status bar, and command palette. */
export const GIT_UI_KEY_PREFIXES = [
  'git.',
  'empty.git.',
  'panel.git.',
  'status.gitTitle',
  'command.git',
] as const

export function listGitUiTranslationKeys(): TranslationKey[] {
  const zhKeys = Object.keys(translations['zh-CN']) as TranslationKey[]
  return zhKeys.filter((key) =>
    GIT_UI_KEY_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix)),
  )
}

const jaAll: Partial<Record<TranslationKey, string>> = {
  ...JA_JP_BULK_OVERRIDES,
  ...JA_JP_OVERRIDES,
}

describe('Git UI ja-JP (1.1.6.4)', () => {
  it('lists every Git-adjacent UI key', () => {
    const keys = listGitUiTranslationKeys()
    expect(keys.length).toBeGreaterThanOrEqual(70)
    expect(keys).toContain('empty.git.title')
    expect(keys).toContain('status.gitTitle')
  })

  it('has explicit ja overrides for all Git-adjacent keys', () => {
    for (const key of listGitUiTranslationKeys()) {
      expect(jaAll[key], key).toBeTruthy()
    }
  })

  it('renders Japanese for empty Git state and status bar hint', () => {
    expect(translateKey('ja-JP', 'empty.git.title')).toMatch(/Git/)
    expect(translateKey('ja-JP', 'empty.git.desc')).toMatch(/リポジトリ/)
    expect(translateKey('ja-JP', 'status.gitTitle')).toMatch(/パネル/)
    expect(translateKey('ja-JP', 'git.historyLoadMore')).toMatch(/履歴/)
  })
})
