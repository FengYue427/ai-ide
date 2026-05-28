import { describe, expect, it } from 'vitest'
import { supportsFimApi, trimCompletionToMaxLines } from './fimCompletionService'

describe('fimCompletionService', () => {
  describe('supportsFimApi', () => {
    it('supports deepseek FIM endpoint', () => {
      expect(supportsFimApi('deepseek')).toBe(true)
    })

    it('supports ollama FIM endpoint', () => {
      expect(supportsFimApi('ollama')).toBe(true)
    })

    it('supports qwen FIM endpoint', () => {
      expect(supportsFimApi('qwen')).toBe(true)
    })

    it('does not support chat-only providers', () => {
      expect(supportsFimApi('openai')).toBe(false)
      expect(supportsFimApi('claude')).toBe(false)
      expect(supportsFimApi('google')).toBe(false)
      expect(supportsFimApi('zhipu')).toBe(false)
      expect(supportsFimApi('minimax')).toBe(false)
      expect(supportsFimApi('grok')).toBe(false)
    })
  })

  describe('trimCompletionToMaxLines', () => {
    it('trims to max lines', () => {
      expect(trimCompletionToMaxLines('a\nb\nc', 2)).toBe('a\nb')
    })

    it('keeps short completions intact', () => {
      expect(trimCompletionToMaxLines('single', 5)).toBe('single')
    })

    it('handles empty string', () => {
      expect(trimCompletionToMaxLines('', 5)).toBe('')
    })

    it('handles maxLines = 0', () => {
      expect(trimCompletionToMaxLines('a\nb', 0)).toBe('')
    })

    it('normalizes CRLF line endings', () => {
      expect(trimCompletionToMaxLines('a\r\nb\r\nc', 2)).toBe('a\nb')
    })

    it('trims trailing whitespace', () => {
      expect(trimCompletionToMaxLines('a\nb   \n', 5)).toBe('a\nb')
    })
  })
})
