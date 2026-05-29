export interface PlanCatalogItem {
  path: string
  title: string
  uncheckedSteps: number
  stepItems: Array<{ text: string; line: number }>
  lastExecutedAt: string | null
  createdAt: string | null
  tags: string[]
}

interface FileLike {
  name: string
  content: string
}

export type PlanCatalogSort = 'recent-exec' | 'most-open' | 'title'

const PLAN_FILE_RE = /^\.aide\/plans\/.+\.md$/i
const PLAN_TEMPLATE_DIR_RE = /^\.aide\/plans\/_templates\//i
const CHECKBOX_RE = /^\s*-\s*\[\s\]\s+.+$/gm
const CHECKBOX_LINE_RE = /^\s*-\s*\[\s\]\s+(.+)\s*$/
const EXEC_RE = /^##\s+Plan Step Execution\s+\((.+)\)\s*$/gm
const CREATED_RE = /^-\s*Created:\s*(.+)\s*$/im
const TAG_RE = /^-\s*Tags:\s*(.+)\s*$/im
const TITLE_RE = /^#\s+(.+)\s*$/m

function filenameTitle(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  return fileName.replace(/\.md$/i, '')
}

function parseTags(content: string): string[] {
  const match = content.match(TAG_RE)
  if (!match) return []
  return match[1]
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function parseLastExecutedAt(content: string): string | null {
  const matches = Array.from(content.matchAll(EXEC_RE))
  if (matches.length === 0) return null
  const raw = matches[matches.length - 1][1]?.trim()
  return raw || null
}

export function buildPlanCatalog(files: FileLike[]): PlanCatalogItem[] {
  return files
    .filter((file) => PLAN_FILE_RE.test(file.name) && !PLAN_TEMPLATE_DIR_RE.test(file.name))
    .map((file) => {
      const title = file.content.match(TITLE_RE)?.[1]?.trim() || filenameTitle(file.name)
      const stepItems = file.content
        .split(/\r?\n/)
        .map((line, index) => ({ line, lineNo: index + 1 }))
        .map((item) => ({ text: item.line.match(CHECKBOX_LINE_RE)?.[1]?.trim() || '', line: item.lineNo }))
        .filter((item) => !!item.text)
      const uncheckedSteps = Array.from(file.content.matchAll(CHECKBOX_RE)).length
      const createdAt = file.content.match(CREATED_RE)?.[1]?.trim() || null
      const lastExecutedAt = parseLastExecutedAt(file.content)
      const tags = parseTags(file.content)
      return {
        path: file.name,
        title,
        uncheckedSteps,
        stepItems,
        createdAt,
        lastExecutedAt,
        tags,
      }
    })
}

export function filterPlanCatalog(items: PlanCatalogItem[], query: string): PlanCatalogItem[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return items
  return items.filter((item) => {
    const haystack = [item.path, item.title, ...item.tags].join(' ').toLowerCase()
    return haystack.includes(trimmed)
  })
}

export function sortPlanCatalog(items: PlanCatalogItem[], sortBy: PlanCatalogSort): PlanCatalogItem[] {
  const next = [...items]
  if (sortBy === 'title') {
    return next.sort((a, b) => a.title.localeCompare(b.title))
  }
  if (sortBy === 'most-open') {
    return next.sort((a, b) => b.uncheckedSteps - a.uncheckedSteps || a.title.localeCompare(b.title))
  }
  return next.sort((a, b) => {
    const aDate = a.lastExecutedAt ? Date.parse(a.lastExecutedAt) : 0
    const bDate = b.lastExecutedAt ? Date.parse(b.lastExecutedAt) : 0
    return bDate - aDate || b.uncheckedSteps - a.uncheckedSteps || a.title.localeCompare(b.title)
  })
}

