import { describe, expect, it } from 'vitest'
import { runGroundingGate } from './groundingGateService'

describe('runGroundingGate', () => {
  it('passes when tasks file exists and paths resolve', () => {
    const result = runGroundingGate(
      [
        { name: '.aide/specs/demo/tasks.md', content: '- [ ] Update `src/app.ts`', language: 'markdown' },
        { name: 'src/app.ts', content: 'export {}', language: 'typescript' },
      ],
      '.aide/specs/demo/tasks.md',
      'Update `src/app.ts`',
    )
    expect(result.ok).toBe(true)
  })

  it('fails when referenced path is missing', () => {
    const result = runGroundingGate(
      [{ name: '.aide/specs/demo/tasks.md', content: '- [ ] Do work', language: 'markdown' }],
      '.aide/specs/demo/tasks.md',
      'Edit `src/missing.ts`',
    )
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.kind === 'missing-path')).toBe(true)
  })
})
