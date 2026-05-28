import { describe, expect, it } from 'vitest'
import { buildMcpFollowUpMessages } from './chatMcpFollowUp'

describe('buildMcpFollowUpMessages', () => {
  it('appends assistant and follow-up instruction turns', () => {
    const out = buildMcpFollowUpMessages(
      [{ role: 'system', content: 'S' }],
      'A_SO_FAR',
      'FOLLOWUP',
    )
    expect(out).toEqual([
      { role: 'system', content: 'S' },
      { role: 'assistant', content: 'A_SO_FAR' },
      { role: 'user', content: 'FOLLOWUP' },
    ])
  })
})
