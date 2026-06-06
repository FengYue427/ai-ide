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
    expect(items[0].hasHooks).toBe(false)
    expect(items[0].hooksCount).toBe(0)
  })

  it('includes hooks metadata from previews', () => {
    const files = [{ name: '.aide/specs/demo/tasks.md', content: '# Demo\n\n- [ ] Task\n' }]
    const previews = {
      '.aide/specs/demo/tasks.md': {
        hooksPath: '.aide/specs/demo/hooks.yaml',
        exists: true,
        parse: {
          ok: true,
          document: {
            version: 1 as const,
            hooks: [{ id: 'a', on: 'queue.before' as const, run: 'shell' as const, command: 'npm test' }],
          },
          errors: [],
        },
        previewLines: ['a · queue.before · shell'],
      },
    }
    const items = buildSpecCatalog(files, { hooksPreviews: previews })
    expect(items[0].hooksCount).toBe(1)
    expect(items[0].hooksValid).toBe(true)
  })

  it('sorts by most open tasks', () => {
    const items = buildSpecCatalog([
      { name: '.aide/specs/a/tasks.md', content: '- [ ] one\n' },
      { name: '.aide/specs/b/tasks.md', content: '- [ ] one\n- [ ] two\n' },
    ])
    expect(sortSpecCatalog(items, 'most-open')[0].specName).toBe('b')
  })
})
