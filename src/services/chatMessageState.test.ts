import { describe, expect, it } from 'vitest'
import { removeTrailingUserMessage, upsertAssistantMessage } from './chatMessageState'

describe('chatMessageState helpers', () => {
  it('upserts assistant message', () => {
    expect(upsertAssistantMessage([{ role: 'user', content: 'u' }], 'a')).toEqual([
      { role: 'user', content: 'u' },
      { role: 'assistant', content: 'a' },
    ])
    expect(upsertAssistantMessage([{ role: 'assistant', content: 'a1' }], 'a2')).toEqual([
      { role: 'assistant', content: 'a2' },
    ])
  })

  it('removes matching trailing user message only', () => {
    expect(removeTrailingUserMessage([{ role: 'user', content: 'u1' }], 'u1')).toEqual([])
    expect(removeTrailingUserMessage([{ role: 'user', content: 'u1' }], 'u2')).toEqual([
      { role: 'user', content: 'u1' },
    ])
  })
})
