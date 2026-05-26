import { describe, expect, it } from 'vitest'
import { supportsFimApi, trimCompletionToMaxLines } from './fimCompletionService'

describe('fimCompletionService', () => {
  it('supports deepseek FIM endpoint', () => {
    expect(supportsFimApi('deepseek')).toBe(true)
    expect(supportsFimApi('openai')).toBe(false)
  })

  it('trims completion to max lines', () => {
    expect(trimCompletionToMaxLines('a\nb\nc', 2)).toBe('a\nb')
    expect(trimCompletionToMaxLines('single', 5)).toBe('single')
  })
})
