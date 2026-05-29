import { describe, expect, it } from 'vitest'
import { duplicatePlanFile } from './planDuplicateService'

describe('planDuplicateService', () => {
  it('duplicates plan with new path and copy title', () => {
    const files = [
      {
        name: '.aide/plans/original.md',
        content: '# Original Plan\n\n- [ ] step one\n',
        language: 'markdown',
      },
    ]
    const result = duplicatePlanFile(files, '.aide/plans/original.md', ' (copy)', new Date('2026-05-28T12:00:00.000Z'))
    expect(result).not.toBeNull()
    expect(result?.path).not.toBe('.aide/plans/original.md')
    expect(result?.files).toHaveLength(2)
    expect(result?.files[1].content).toContain('# Original Plan (copy)')
    expect(result?.files[1].content).toContain('- [ ] step one')
  })
})
