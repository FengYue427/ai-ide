import { describe, expect, it } from 'vitest'
import { normalizeProjectPath, splitParentAndName } from './localProjectPaths'

describe('localProjectPaths', () => {
  it('normalizes relative paths', () => {
    expect(normalizeProjectPath('./src/App.tsx')).toBe('src/App.tsx')
    expect(normalizeProjectPath('src\\lib\\x.ts')).toBe('src/lib/x.ts')
  })

  it('rejects path traversal', () => {
    expect(normalizeProjectPath('../secret')).toBeNull()
    expect(normalizeProjectPath('src/../../x')).toBeNull()
  })

  it('splits parent and name', () => {
    expect(splitParentAndName('src/App.tsx')).toEqual({
      parentParts: ['src'],
      name: 'App.tsx',
    })
    expect(splitParentAndName('README.md')).toEqual({
      parentParts: [],
      name: 'README.md',
    })
  })
})
