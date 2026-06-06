import { describe, expect, it } from 'vitest'
import {
  acceptNextLine,
  acceptNextWord,
  createPartialGhostState,
  isPartialGhostComplete,
} from './tabPlusPlusPartialAccept'

describe('tabPlusPlusPartialAccept', () => {
  it('accepts ghost text word by word', () => {
    const state = createPartialGhostState('foo bar\nbaz')
    expect(acceptNextWord(state).accepted).toBe('foo ')
    expect(acceptNextWord(state).accepted).toBe('bar\n')
    expect(isPartialGhostComplete(state)).toBe(false)
    expect(acceptNextLine(state).done).toBe(true)
    expect(isPartialGhostComplete(state)).toBe(true)
  })
})
