import { describe, expect, it } from 'vitest'
import {
  findSpecTasksPathForPlanStep,
  listPlanLinksForSpec,
  type PlanSpecLink,
} from './planSpecLinkService'

const links: PlanSpecLink[] = [
  {
    planPath: '.aide/plans/p.md',
    planStepText: 'Step A',
    specTasksPath: '.aide/specs/x/tasks.md',
    specTaskText: 'Task A',
    createdAt: '2026-05-28T00:00:00.000Z',
  },
]

describe('planSpecLinkService navigation', () => {
  it('finds spec tasks path for plan step', () => {
    expect(findSpecTasksPathForPlanStep(links, '.aide/plans/p.md', 'Step A')).toBe('.aide/specs/x/tasks.md')
  })

  it('lists unique plan links for spec', () => {
    expect(listPlanLinksForSpec(links, '.aide/specs/x/tasks.md')).toHaveLength(1)
  })
})
