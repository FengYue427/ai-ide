import { parseProjectTasks } from './projectTasksService'

export interface SpecCatalogItem {
  tasksPath: string
  specName: string
  title: string
  uncheckedTasks: number
  totalTasks: number
  lastExecutedAt: string | null
}

interface FileLike {
  name: string
  content: string
}

export type SpecCatalogSort = 'recent-exec' | 'most-open' | 'title'

const SPEC_TASKS_RE = /^\.aide\/specs\/([^/]+)\/tasks\.md$/i
const SPEC_EXEC_RE = /^##\s+Spec Execution Log \((.+)\)\s*$/gm
const TITLE_RE = /^#\s+(.+)\s*$/m

function specNameFromPath(path: string): string {
  const match = path.match(SPEC_TASKS_RE)
  return match?.[1] ?? path
}

function parseLastExecutedAt(acceptanceContent: string | undefined): string | null {
  if (!acceptanceContent) return null
  const matches = Array.from(acceptanceContent.matchAll(SPEC_EXEC_RE))
  if (matches.length === 0) return null
  return matches[matches.length - 1][1]?.trim() || null
}

export function buildSpecCatalog(files: FileLike[]): SpecCatalogItem[] {
  return files
    .filter((file) => SPEC_TASKS_RE.test(file.name))
    .map((file) => {
      const specName = specNameFromPath(file.name)
      const tasks = parseProjectTasks(file.content)
      const acceptancePath = file.name.replace(/[\\/]tasks\.md$/i, '/acceptance.md')
      const acceptance = files.find((f) => f.name === acceptancePath)
      const title = file.content.match(TITLE_RE)?.[1]?.trim() || specName
      return {
        tasksPath: file.name,
        specName,
        title,
        uncheckedTasks: tasks.filter((t) => !t.done).length,
        totalTasks: tasks.length,
        lastExecutedAt: parseLastExecutedAt(acceptance?.content),
      }
    })
}

export function filterSpecCatalog(items: SpecCatalogItem[], query: string): SpecCatalogItem[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return items
  return items.filter((item) => {
    const haystack = [item.specName, item.title, item.tasksPath].join(' ').toLowerCase()
    return haystack.includes(trimmed)
  })
}

export function sortSpecCatalog(items: SpecCatalogItem[], sortBy: SpecCatalogSort): SpecCatalogItem[] {
  const next = [...items]
  if (sortBy === 'title') {
    return next.sort((a, b) => a.title.localeCompare(b.title))
  }
  if (sortBy === 'most-open') {
    return next.sort((a, b) => b.uncheckedTasks - a.uncheckedTasks || a.title.localeCompare(b.title))
  }
  return next.sort((a, b) => {
    const aTime = a.lastExecutedAt ? Date.parse(a.lastExecutedAt) : 0
    const bTime = b.lastExecutedAt ? Date.parse(b.lastExecutedAt) : 0
    return bTime - aTime || b.uncheckedTasks - a.uncheckedTasks
  })
}
