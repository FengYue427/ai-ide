import { describe, expect, it } from 'vitest'
import { appendToSpecAcceptanceFile } from './specAcceptanceService'

describe('appendToSpecAcceptanceFile', () => {
  it('appends addition only to target acceptance file', () => {
    const files = [
      { name: '.aide/specs/a/acceptance.md', content: 'A' },
      { name: '.aide/specs/b/acceptance.md', content: 'B' },
    ]
    const next = appendToSpecAcceptanceFile(files, '.aide/specs/a/acceptance.md', '\nLOG')
    expect(next[0].content).toBe('A\nLOG')
    expect(next[1].content).toBe('B')
  })

  it('returns original files when addition is empty', () => {
    const files = [{ name: '.aide/specs/a/acceptance.md', content: 'A' }]
    const next = appendToSpecAcceptanceFile(files, '.aide/specs/a/acceptance.md', '')
    expect(next).toBe(files)
  })
})
