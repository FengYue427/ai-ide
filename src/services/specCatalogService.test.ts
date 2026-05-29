import { describe, expect, it } from 'vitest'
import { buildSpecCatalog, sortSpecCatalog } from './specCatalogService'

describe('specCatalogService', () => {
  it('builds catalog from spec tasks files', () => {
    const files = [
      { name: '.aide/specs/auth/tasks.md', content: '# Auth\n\n- [ ] Task A\n- [x] Done\n' },
      {
        name: '.aide/specs/auth/acceptance.md',
        content: '## Spec Execution Log (2026-05-28)\n',
      },
    ]
    const items = buildSpecCatalog(files)
    expect(items).toHaveLength(1)
    expect(items[0].uncheckedTasks).toBe(1)
    expect(items[0].lastExecutedAt).toBe('2026-05-28')
  })

  it('sorts by most open tasks', () => {
    const items = buildSpecCatalog([
      { name: '.aide/specs/a/tasks.md', content: '- [ ] one\n' },
      { name: '.aide/specs/b/tasks.md', content: '- [ ] one\n- [ ] two\n' },
    ])
    expect(sortSpecCatalog(items, 'most-open')[0].specName).toBe('b')
  })
})
