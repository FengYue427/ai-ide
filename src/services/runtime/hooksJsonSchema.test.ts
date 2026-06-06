import { describe, expect, it } from 'vitest'
import { parseHooksYaml } from './hooksSchema'
import { validateHooksDocumentJsonSchema } from './hooksJsonSchema'

describe('hooksJsonSchema', () => {
  it('validates a parsed hooks document', () => {
    const parsed = parseHooksYaml(`version: 1
hooks:
  - id: pre-run
    on: queue.before
    run: shell
    command: npm test
`)
    expect(parsed.ok).toBe(true)
    expect(validateHooksDocumentJsonSchema(parsed.document!)).toEqual([])
  })

  it('reports schema errors for invalid run payload', () => {
    const parsed = parseHooksYaml(`version: 1
hooks:
  - id: bad
    on: queue.before
    run: shell
`)
    expect(parsed.ok).toBe(false)
  })
})
