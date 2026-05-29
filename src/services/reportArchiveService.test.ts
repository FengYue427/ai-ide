import { describe, expect, it } from 'vitest'
import { pickReportPathsToPrune, removeReportsFromFiles } from './reportArchiveService'
import type { ReportCatalogItem } from './reportCatalogService'

function item(path: string, generatedAt: string): ReportCatalogItem {
  return { path, title: path, generatedAt, status: null, summary: null }
}

describe('reportArchiveService', () => {
  it('picks older reports beyond keepRecent', () => {
    const catalog = [
      item('.aide/reports/a.md', '2026-05-28T10:00:00.000Z'),
      item('.aide/reports/b.md', '2026-05-27T10:00:00.000Z'),
      item('.aide/reports/c.md', '2026-05-26T10:00:00.000Z'),
    ]
    const toDelete = pickReportPathsToPrune(catalog, 2)
    expect(toDelete).toEqual(['.aide/reports/c.md'])
  })

  it('returns empty when count within keepRecent', () => {
    const catalog = [item('.aide/reports/a.md', '2026-05-28T10:00:00.000Z')]
    expect(pickReportPathsToPrune(catalog, 5)).toEqual([])
  })

  it('removes report files from workspace list', () => {
    const files = [
      { name: '.aide/reports/a.md', content: '# A' },
      { name: 'index.html', content: '<html></html>' },
    ]
    const next = removeReportsFromFiles(files, ['.aide/reports/a.md'])
    expect(next).toHaveLength(1)
    expect(next[0].name).toBe('index.html')
  })
})
