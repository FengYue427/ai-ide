import { describe, expect, it } from 'vitest'
import { runGroundingGateV2 } from './groundingGateV2Service'

describe('runGroundingGateV2', () => {
  it('blocks when referenced symbol is missing', () => {
    const result = runGroundingGateV2(
      [
        {
          name: '.aide/specs/demo/tasks.md',
          content: '- [ ] Add type ZzUniqueSymbol99 for app state',
          language: 'markdown',
        },
        { name: 'src/app.ts', content: 'export const other = 1', language: 'typescript' },
      ],
      '.aide/specs/demo/tasks.md',
      'Add type ZzUniqueSymbol99 for app state',
    )
    expect(result.ok).toBe(false)
    expect(result.summary).toContain('Grounding v2')
  })
})
