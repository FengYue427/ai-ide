import { describe, expect, it } from 'vitest'
import {
  acceptancePathFromTasksPath,
  parseAcceptanceCriteria,
  setAcceptanceCriterionChecked,
} from './acceptanceEditorService'

const SAMPLE = `# Acceptance

- [ ] Login works
- [x] Logout works
- [ ] Run npm test
`

describe('acceptanceEditorService', () => {
  it('derives acceptance path from tasks path', () => {
    expect(acceptancePathFromTasksPath('.aide/specs/demo/tasks.md')).toBe(
      '.aide/specs/demo/acceptance.md',
    )
  })

  it('parses checkbox criteria', () => {
    const items = parseAcceptanceCriteria(SAMPLE)
    expect(items).toHaveLength(3)
    expect(items[0]).toMatchObject({ text: 'Login works', checked: false })
    expect(items[1]).toMatchObject({ text: 'Logout works', checked: true })
  })

  it('toggles a criterion line', () => {
    const items = parseAcceptanceCriteria(SAMPLE)
    const next = setAcceptanceCriterionChecked(SAMPLE, items[0].lineIndex, true)
    expect(next).toContain('- [x] Login works')
    expect(parseAcceptanceCriteria(next)[0]?.checked).toBe(true)
  })
})
