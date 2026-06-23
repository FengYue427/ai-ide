import { describe, expect, it } from 'vitest'
import { formatQuickInfoMarkdown } from './monacoQuickInfoMarkdown'

describe('formatQuickInfoMarkdown', () => {
  it('formats signature and documentation', () => {
    const markdown = formatQuickInfoMarkdown({
      kind: 'function',
      textSpan: { start: 0, length: 4 },
      displayParts: [{ text: 'function greet(name: string): void', kind: 'text' }],
      documentation: [{ text: 'Says hello.', kind: 'text' }],
    })

    expect(markdown).toContain('function greet')
    expect(markdown).toContain('Says hello.')
  })

  it('includes deprecated tag', () => {
    const markdown = formatQuickInfoMarkdown({
      kind: 'function',
      textSpan: { start: 0, length: 3 },
      displayParts: [{ text: 'oldFn()', kind: 'text' }],
      tags: [{ name: 'deprecated' }],
    })

    expect(markdown).toContain('Deprecated')
  })
})
