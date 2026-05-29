import { QUEUE_REPORT_ROOT } from './queueExecutionReportService'

export interface ReportCatalogItem {
  path: string
  title: string
  generatedAt: string | null
  status: string | null
  summary: string | null
}

interface FileLike {
  name: string
  content: string
}

export type ReportCatalogSort = 'recent' | 'title'

const REPORT_FILE_RE = /^\.aide\/reports\/.+\.md$/i
const GENERATED_RE = /^-\s*Generated At:\s*(.+)\s*$/im
const STATUS_RE = /^-\s*Status:\s*(.+)\s*$/im
const SUCCESS_RE = /^-\s*Success:\s*(.+)\s*$/im
const TITLE_RE = /^#\s+(.+)\s*$/m

function filenameTitle(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  return fileName.replace(/\.md$/i, '')
}

function parseGeneratedAt(content: string, path: string): string | null {
  const fromContent = content.match(GENERATED_RE)?.[1]?.trim()
  if (fromContent) return fromContent
  const match = path.match(/queue-(.+)\.md$/i)
  if (!match) return null
  const raw = match[1].replace(/-/g, ':')
  const parsed = Date.parse(raw.includes('T') ? raw : raw.replace(/:/g, '-'))
  return Number.isNaN(parsed) ? match[1] : new Date(parsed).toISOString()
}

export function buildReportCatalog(files: FileLike[]): ReportCatalogItem[] {
  return files
    .filter((file) => REPORT_FILE_RE.test(file.name))
    .map((file) => {
      const title = file.content.match(TITLE_RE)?.[1]?.trim() || filenameTitle(file.name)
      const generatedAt = parseGeneratedAt(file.content, file.name)
      const status = file.content.match(STATUS_RE)?.[1]?.trim() || null
      const summary = file.content.match(SUCCESS_RE)?.[1]?.trim() || null
      return {
        path: file.name,
        title,
        generatedAt,
        status,
        summary,
      }
    })
}

export function filterReportCatalog(items: ReportCatalogItem[], query: string): ReportCatalogItem[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return items
  return items.filter((item) => {
    const haystack = [item.path, item.title, item.status ?? '', item.summary ?? ''].join(' ').toLowerCase()
    return haystack.includes(trimmed)
  })
}

export function sortReportCatalog(items: ReportCatalogItem[], sortBy: ReportCatalogSort): ReportCatalogItem[] {
  const next = [...items]
  if (sortBy === 'title') {
    return next.sort((a, b) => a.title.localeCompare(b.title))
  }
  return next.sort((a, b) => {
    const aTime = a.generatedAt ? Date.parse(a.generatedAt) : 0
    const bTime = b.generatedAt ? Date.parse(b.generatedAt) : 0
    return bTime - aTime || a.title.localeCompare(b.title)
  })
}

export function findLatestReportPath(files: FileLike[]): string | null {
  const catalog = sortReportCatalog(buildReportCatalog(files), 'recent')
  return catalog[0]?.path ?? null
}

export { QUEUE_REPORT_ROOT }
