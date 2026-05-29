import { describe, expect, it } from 'vitest'
import { buildReportCatalog, findLatestReportPath, sortReportCatalog } from './reportCatalogService'

describe('reportCatalogService', () => {
  it('builds catalog from .aide/reports markdown files', () => {
    const files = [
      {
        name: '.aide/reports/queue-2026-05-28T10-00-00.md',
        content: '# Queue Execution Report\n\n- Generated At: 2026-05-28T10:00:00.000Z\n- Status: queued\n- Success: Plan 1, Spec 0',
      },
      { name: '.aide/plans/p.md', content: '' },
    ]
    const items = buildReportCatalog(files)
    expect(items).toHaveLength(1)
    expect(items[0].status).toBe('queued')
    expect(items[0].summary).toContain('Plan 1')
  })

  it('finds latest report path by generated time', () => {
    const files = [
      {
        name: '.aide/reports/queue-old.md',
        content: '# Queue Execution Report\n\n- Generated At: 2026-05-27T10:00:00.000Z',
      },
      {
        name: '.aide/reports/queue-new.md',
        content: '# Queue Execution Report\n\n- Generated At: 2026-05-28T10:00:00.000Z',
      },
    ]
    expect(findLatestReportPath(files)).toBe('.aide/reports/queue-new.md')
    expect(sortReportCatalog(buildReportCatalog(files), 'recent')[0].path).toBe('.aide/reports/queue-new.md')
  })
})
