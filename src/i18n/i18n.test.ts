import { describe, expect, it } from 'vitest'
import { interpolate, translations } from './translations'
import { getTranslationTable } from './localeTables'

describe('i18n translations', () => {
  it('has matching keys in zh-CN and en-US', () => {
    const zh = Object.keys(translations['zh-CN'])
    const en = Object.keys(translations['en-US'])
    expect(en.sort()).toEqual(zh.sort())
  })

  it('ja-JP inherits en-US for keys without overrides', () => {
    const ja = getTranslationTable('ja-JP')
    expect(ja['limits.learnMore']).toBe(translations['en-US']['limits.learnMore'])
  })

  it('interpolates placeholders', () => {
    expect(interpolate('Hello {name}', { name: 'Ada' })).toBe('Hello Ada')
  })
})
