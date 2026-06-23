import { describe, expect, it } from 'vitest'
import { parseLinkageReasons, serializeLinkageReasons } from './linkageReason'

describe('linkageReason', () => {
  it('round-trips reason serialization', () => {
    const raw = serializeLinkageReasons([
      { id: 'open-tasks', detail: '3' },
      { id: 'git-clean' },
    ])
    expect(parseLinkageReasons(raw)).toEqual([
      { id: 'open-tasks', detail: '3' },
      { id: 'git-clean' },
    ])
  })
})
