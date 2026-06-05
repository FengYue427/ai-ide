import { describe, expect, it } from 'vitest'
import { goToDefinition, goToReferences } from './languageServiceHostCore'

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

  it('resolves Python def across files', () => {
    const result = goToDefinition({
      file: 'main.py',
      line: 3,
      symbol: 'greet',
      files: [
        { name: 'main.py', content: 'from lib.util import greet\n\ndef run():\n    return greet()\n' },
        { name: 'lib/util.py', content: 'def greet():\n    return 42\n' },
      ],
    })
    expect(result?.path).toBe('lib/util.py')
    expect(result?.column).toBeGreaterThan(0)
  })

  it('finds references across workspace files', () => {
    const refs = goToReferences({
      symbol: 'login',
      files: [
        { name: 'a.ts', content: 'export function login() {}\nlogin()\n', language: 'typescript' },
        { name: 'b.ts', content: 'import { login } from "./a"\nlogin()\n', language: 'typescript' },
      ],
    })
    expect(refs.length).toBeGreaterThanOrEqual(3)
    expect(refs.some((ref) => ref.path === 'b.ts')).toBe(true)
  })
})
