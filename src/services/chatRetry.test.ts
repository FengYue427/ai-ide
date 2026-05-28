import { describe, expect, it } from 'vitest'
import { findRetryUserText } from './chatRetry'

describe('findRetryUserText', () => {
  it('finds nearest previous user message', () => {
    const messages = [
      { role: 'assistant' as const, content: 'welcome' },
      { role: 'user' as const, content: 'first' },
      { role: 'assistant' as const, content: 'reply' },
      { role: 'user' as const, content: 'second' },
      { role: 'assistant' as const, content: 'reply2' },
    ]
    expect(findRetryUserText(messages, 5)).toBe('second')
    expect(findRetryUserText(messages, 3)).toBe('first')
  })

  it('returns empty string when no previous user message', () => {
    const messages = [{ role: 'assistant' as const, content: 'welcome' }]
    expect(findRetryUserText(messages, 1)).toBe('')
  })
})
