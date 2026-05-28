import { describe, expect, it } from 'vitest'
import { buildChatHistory } from './chatHistory'

describe('buildChatHistory', () => {
  it('skips welcome message and respects history limit', () => {
    const messages = [
      { role: 'assistant' as const, content: 'welcome' },
      { role: 'user' as const, content: 'u1' },
      { role: 'assistant' as const, content: 'a1' },
      { role: 'user' as const, content: 'u2' },
    ]
    expect(buildChatHistory(messages, 2)).toEqual([
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'u2' },
    ])
  })
})
