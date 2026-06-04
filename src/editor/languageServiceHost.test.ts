import { describe, expect, it } from 'vitest'
import { goToDefinition } from './languageServiceHostCore'

describe('languageServiceHost', () => {
  it('resolves symbol in another file', () => {
    const result = goToDefinition({
      file: 'main.ts',
      line: 10,
      symbol: 'helper',
      files: [
        { name: 'main.ts', content: 'helper();\n', language: 'typescript' },
        { name: 'util.ts', content: 'export function helper() {}\n', language: 'typescript' },
      ],
    })
    expect(result?.path).toBe('util.ts')
    expect(result?.line).toBeGreaterThan(0)
  })

  it('skips same-line self reference', () => {
    const result = goToDefinition({
      file: 'a.ts',
      line: 1,
      symbol: 'foo',
      files: [{ name: 'a.ts', content: 'function foo() {}\nfoo();\n', language: 'typescript' }],
    })
    expect(result).toBeNull()
  })
})
