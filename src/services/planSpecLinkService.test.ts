import { describe, expect, it } from 'vitest'
import {
  PLAN_SPEC_LINKS_PATH,
  buildPlanLinkCountMap,
  readPlanSpecLinks,
  summarizeSpecSources,
  upsertPlanSpecLinksFile,
} from './planSpecLinkService'

describe('planSpecLinkService', () => {
  it('upserts links file and deduplicates same mapping', () => {
    const files = [{ name: '.aide/plans/a.md', content: '- [ ] x', language: 'markdown' }]
    const next = upsertPlanSpecLinksFile(files, [
      {
        planPath: '.aide/plans/a.md',
        planStepText: 'Step A',
        planStepLine: 3,
        specTasksPath: '.aide/specs/s/tasks.md',
        specTaskText: 'Task A',
      },
      {
        planPath: '.aide/plans/a.md',
        planStepText: 'Step A',
        planStepLine: 3,
        specTasksPath: '.aide/specs/s/tasks.md',
        specTaskText: 'Task A',
      },
    ])
    const parsed = readPlanSpecLinks(next)
    expect(next.some((item) => item.name === PLAN_SPEC_LINKS_PATH)).toBe(true)
    expect(parsed).toHaveLength(1)
  })

  it('builds counts and source summaries', () => {
    const links = [
      {
        planPath: '.aide/plans/a.md',
        planStepText: 'Step A',
        specTasksPath: '.aide/specs/s/tasks.md',
        specTaskText: 'Task A',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        planPath: '.aide/plans/b.md',
        planStepText: 'Step B',
        specTasksPath: '.aide/specs/s/tasks.md',
        specTaskText: 'Task B',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    const countMap = buildPlanLinkCountMap(links)
    expect(countMap['.aide/plans/a.md::step a']).toBe(1)
    expect(summarizeSpecSources(links, '.aide/specs/s/tasks.md', 1)).toHaveLength(1)
  })
})
