import { describe, expect, it } from 'vitest'
import { getLanguageFromExt } from './getLanguageFromExt'

describe('getLanguageFromExt', () => {
  it('maps common developer extensions', () => {
    expect(getLanguageFromExt('Main.java')).toBe('java')
    expect(getLanguageFromExt('module.cpp')).toBe('cpp')
    expect(getLanguageFromExt('lib.hpp')).toBe('cpp')
    expect(getLanguageFromExt('main.go')).toBe('go')
    expect(getLanguageFromExt('lib.rs')).toBe('rust')
    expect(getLanguageFromExt('app.tsx')).toBe('typescript')
  })

  it('handles dockerfile and nested paths', () => {
    expect(getLanguageFromExt('Dockerfile')).toBe('dockerfile')
    expect(getLanguageFromExt('src/pkg/main.py')).toBe('python')
  })
})
