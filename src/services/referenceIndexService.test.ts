import { describe, expect, it } from 'vitest'
import { findReferencesInFiles } from './referenceIndexService'

describe('referenceIndexService', () => {
  it('finds symbol references across files', () => {
    const hits = findReferencesInFiles(
      [
        { name: 'a.ts', content: 'login()\nexport function login() {}' },
        { name: 'b.ts', content: 'import { login } from "./a"\nlogin()' },
      ],
      'login',
    )
    expect(hits.length).toBeGreaterThanOrEqual(3)
    expect(hits.some((h) => h.path === 'b.ts')).toBe(true)
  })
})
