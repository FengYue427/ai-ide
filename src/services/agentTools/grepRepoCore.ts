import { collectSearchableFiles, searchInFiles, type SearchResult } from '../searchService'
import { workspaceContextService } from '../workspaceContextService'

export type GrepRepoOptions = {
  pattern: string
  glob?: string
  limit?: number
  caseSensitive?: boolean
  regex?: boolean
}

export function formatGrepHit(hit: SearchResult): string {
  return `${hit.file}:${hit.line}: ${hit.content}`
}

export function filterPathsByGlob(paths: string[], glob?: string): string[] {
  if (!glob?.trim()) return paths
  const norm = glob.replace(/\\/g, '/')
  const reSource = norm
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\/?/g, '(?:.*/)?')
    .replace(/\*/g, '[^/]*')
  const re = new RegExp(`^${reSource}$`, 'i')
  return paths.filter((p) => re.test(p.replace(/\\/g, '/')))
}

export function grepInSources(
  editorFiles: { name: string; content: string }[],
  workspaceFiles: { path: string; content: string }[],
  options: GrepRepoOptions,
): SearchResult[] {
  const pattern = options.pattern.trim()
  if (!pattern) return []

  let files = collectSearchableFiles(editorFiles, workspaceFiles)
  if (options.glob) {
    const allowed = new Set(filterPathsByGlob(files.map((f) => f.name), options.glob))
    files = files.filter((f) => allowed.has(f.name))
  }

  const hits = searchInFiles(files, pattern, {
    caseSensitive: options.caseSensitive,
    regex: options.regex,
  })

  const limit = Math.min(Math.max(options.limit ?? 40, 1), 200)
  return hits.slice(0, limit)
}

export function grepRepoFromWorkspace(options: GrepRepoOptions): SearchResult[] {
  const workspaceFiles = workspaceContextService.getAllFiles().map((f) => ({
    path: f.path,
    content: f.content,
  }))
  return grepInSources([], workspaceFiles, options)
}
