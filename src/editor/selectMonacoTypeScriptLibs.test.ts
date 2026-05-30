import { describe, expect, it } from 'vitest'
import { MAX_MONACO_TS_LIBS, selectMonacoTypeScriptLibs } from './selectMonacoTypeScriptLibs'
import type { ProjectFileSource } from './syncTypeScriptProject'

function file(name: string, content = 'export {}'): ProjectFileSource {
  return { name, content, language: 'typescript' }
}

describe('selectMonacoTypeScriptLibs', () => {
  it('returns all when under cap', () => {
    const picked = selectMonacoTypeScriptLibs([file('a.ts'), file('b.ts')])
    expect(picked).toHaveLength(2)
  })

  it('prioritizes active file when over cap', () => {
    const many = Array.from({ length: MAX_MONACO_TS_LIBS + 10 }, (_, i) => file(`f${i}.ts`))
    many.push(file('active/main.ts'))
    const picked = selectMonacoTypeScriptLibs(many, 'active/main.ts')
    expect(picked.some((f) => f.name === 'active/main.ts')).toBe(true)
    expect(picked.length).toBe(MAX_MONACO_TS_LIBS)
  })

  it('skips oversized script files', () => {
    const picked = selectMonacoTypeScriptLibs([
      file('big.ts', 'x'.repeat(100_001)),
      file('small.ts'),
    ])
    expect(picked.map((f) => f.name)).toEqual(['small.ts'])
  })
})
