import { describe, expect, it } from 'vitest'
import { pickRicherFileSet } from './workspaceSession'

describe('pickRicherFileSet', () => {
  it('prefers more files', () => {
    const a = [{ name: 'a.js', content: '' }]
    const b = [
      { name: 'a.js', content: '' },
      { name: 'b.js', content: '' },
    ]
    expect(pickRicherFileSet(a, b)?.length).toBe(2)
  })

  it('returns null when both empty', () => {
    expect(pickRicherFileSet([], null)).toBeNull()
  })
})
