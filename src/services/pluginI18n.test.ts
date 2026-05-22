import { describe, expect, it } from 'vitest'
import {
  createPluginTranslator,
  normalizePluginI18n,
  validatePluginI18n,
} from './pluginI18n'

describe('pluginI18n', () => {
  it('resolves current locale with zh-CN fallback', () => {
    const t = createPluginTranslator(
      {
        'zh-CN': { greet: '你好' },
        'en-US': { greet: 'Hello' },
      },
      'en-US',
    )
    expect(t('greet')).toBe('Hello')
    expect(t('missing')).toBe('missing')
  })

  it('falls back to zh-CN when en-US key missing', () => {
    const t = createPluginTranslator({ 'zh-CN': { only: '仅中文' } }, 'en-US')
    expect(t('only')).toBe('仅中文')
  })

  it('interpolates params', () => {
    const t = createPluginTranslator(
      { 'en-US': { files: 'Files {count}' } },
      'en-US',
    )
    expect(t('files', { count: 3 })).toBe('Files 3')
  })

  it('rejects invalid i18n shape', () => {
    expect(validatePluginI18n([])).toBeTruthy()
    expect(validatePluginI18n({ 'fr-FR': { a: 'b' } })).toMatch(/locale|语言/)
  })

  it('normalizes to both locale buckets', () => {
    const norm = normalizePluginI18n({ 'zh-CN': { a: '1' } })
    expect(norm['zh-CN'].a).toBe('1')
    expect(norm['en-US']).toEqual({})
  })
})
