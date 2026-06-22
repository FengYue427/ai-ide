import { describe, expect, it } from 'vitest'
import { buildSpecAcceptanceLinkage } from './specAcceptanceLinkage'

describe('specAcceptanceLinkage', () => {
  it('marks ready when tasks and acceptance are complete', () => {
    const linkage = buildSpecAcceptanceLinkage([
      {
        name: '.aide/specs/demo/tasks.md',
        content: '- [x] Task\n',
        language: 'markdown',
      },
      {
        name: '.aide/specs/demo/acceptance.md',
        content: '- [x] Criterion\n',
        language: 'markdown',
      },
    ])
    expect(linkage.readyForProof).toBe(true)
    expect(linkage.activeSpecSlug).toBe('demo')
  })
})
