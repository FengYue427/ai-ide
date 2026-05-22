import { describe, expect, it } from 'vitest'
import { normalizeLanguage } from './language'

describe('normalizeLanguage', () => {
  it('maps legacy zh to zh-CN', () => {
    expect(normalizeLanguage('zh')).toBe('zh-CN')
  })

  it('maps legacy en to en-US', () => {
    expect(normalizeLanguage('en')).toBe('en-US')
  })

  it('keeps zh-CN and en-US', () => {
    expect(normalizeLanguage('zh-CN')).toBe('zh-CN')
    expect(normalizeLanguage('en-US')).toBe('en-US')
  })
})
