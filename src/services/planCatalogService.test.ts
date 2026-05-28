import { describe, expect, it } from 'vitest'
import { buildPlanCatalog, filterPlanCatalog, sortPlanCatalog } from './planCatalogService'

describe('planCatalogService', () => {
  const files = [
    {
      name: '.aide/plans/alpha.md',
      content: `# Alpha Plan
- Created: 2026-05-28T10:00:00.000Z
- Tags: core,chat

- [ ] step one
- [ ] step two

## Plan Step Execution (2026-05-28T11:00:00.000Z)
`,
    },
    {
      name: '.aide/plans/beta.md',
      content: `# Beta Plan
- [ ] beta step
`,
    },
    {
      name: 'README.md',
      content: '# Not a plan',
    },
  ]

  it('builds plan catalog entries with summary fields', () => {
    const catalog = buildPlanCatalog(files)
    expect(catalog).toHaveLength(2)
    expect(catalog[0].title).toBe('Alpha Plan')
    expect(catalog[0].uncheckedSteps).toBe(2)
    expect(catalog[0].stepItems).toEqual([
      { text: 'step one', line: 5 },
      { text: 'step two', line: 6 },
    ])
    expect(catalog[0].lastExecutedAt).toBe('2026-05-28T11:00:00.000Z')
    expect(catalog[0].tags).toEqual(['core', 'chat'])
  })

  it('filters by keyword', () => {
    const catalog = buildPlanCatalog(files)
    expect(filterPlanCatalog(catalog, 'beta')).toHaveLength(1)
    expect(filterPlanCatalog(catalog, 'chat')).toHaveLength(1)
  })

  it('sorts by unchecked count and title', () => {
    const catalog = buildPlanCatalog(files)
    const byOpen = sortPlanCatalog(catalog, 'most-open')
    expect(byOpen[0].title).toBe('Alpha Plan')
    const byTitle = sortPlanCatalog(catalog, 'title')
    expect(byTitle[0].title).toBe('Alpha Plan')
    expect(byTitle[1].title).toBe('Beta Plan')
  })
})

