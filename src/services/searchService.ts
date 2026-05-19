import Fuse from 'fuse.js'
import { collectIndexSources } from './projectIndexService'

export interface SearchResult {
  file: string
  line: number
  column: number
  content: string
  match: string
}

export interface FileContent {
  name: string
  content: string
}

interface SearchOptions {
  caseSensitive?: boolean
  wholeWord?: boolean
  regex?: boolean
}

/** Merge editor tabs + workspace files (respects index ignore rules). */
export function collectSearchableFiles(
  editorFiles: { name: string; content: string }[],
  workspaceFiles: { path: string; content: string }[] = [],
): FileContent[] {
  return collectIndexSources(
    editorFiles.map((file) => ({ name: file.name, content: file.content })),
    workspaceFiles,
  ).map((file) => ({ name: file.path, content: file.content }))
}

export interface ReplacePreviewItem {
  file: string
  matchCount: number
  sampleLines: number[]
}

export function buildReplacePreview(
  files: FileContent[],
  search: string,
  options: SearchOptions = {},
): ReplacePreviewItem[] {
  const results = searchInFiles(files, search, options)
  const byFile = new Map<string, { count: number; lines: Set<number> }>()

  for (const result of results) {
    const entry = byFile.get(result.file) ?? { count: 0, lines: new Set<number>() }
    entry.count += 1
    entry.lines.add(result.line)
    byFile.set(result.file, entry)
  }

  return [...byFile.entries()]
    .map(([file, entry]) => ({
      file,
      matchCount: entry.count,
      sampleLines: [...entry.lines].sort((a, b) => a - b).slice(0, 5),
    }))
    .sort((a, b) => b.matchCount - a.matchCount)
}

export function highlightMatchSnippet(line: string, query: string, options: SearchOptions = {}): string {
  const matches = findMatches(line, query, options)
  if (matches.length === 0) return line.trim().slice(0, 80)
  const match = matches[0]
  const before = line.slice(0, match.start)
  const hit = line.slice(match.start, match.end)
  const after = line.slice(match.end)
  return `${before}⟦${hit}⟧${after}`.trim().slice(0, 120)
}

export function searchInFiles(files: FileContent[], query: string, options: SearchOptions = {}): SearchResult[] {
  if (!query.trim()) return []

  const results: SearchResult[] = []

  for (const file of files) {
    const lines = file.content.split('\n')

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]
      const lineNumber = index + 1
      const matches = findMatches(line, query, options)

      for (const match of matches) {
        results.push({
          file: file.name,
          line: lineNumber,
          column: match.start + 1,
          content: line.trim(),
          match: line.slice(match.start, match.end),
        })
      }
    }
  }

  return results
}

function findMatches(line: string, query: string, options: SearchOptions): { start: number; end: number }[] {
  if (options.regex) {
    const flags = options.caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(query, flags)
    const matches: { start: number; end: number }[] = []
    let match: RegExpExecArray | null

    while ((match = regex.exec(line)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length })
      if (match[0].length === 0) regex.lastIndex += 1
    }

    return matches
  }

  const searchLine = options.caseSensitive ? line : line.toLowerCase()
  const searchQuery = options.caseSensitive ? query : query.toLowerCase()
  const matches: { start: number; end: number }[] = []
  let index = 0

  while ((index = searchLine.indexOf(searchQuery, index)) !== -1) {
    const end = index + searchQuery.length
    if (options.wholeWord) {
      const before = index > 0 ? searchLine[index - 1] : ' '
      const after = end < searchLine.length ? searchLine[end] : ' '
      if (/\w/.test(before) || /\w/.test(after)) {
        index = end
        continue
      }
    }

    matches.push({ start: index, end })
    index = end
  }

  return matches
}

export function fuzzySearchFiles(files: FileContent[], query: string): SearchResult[] {
  if (!query.trim()) return []

  const fuse = new Fuse(files, {
    keys: ['name', 'content'],
    threshold: 0.4,
    includeScore: true,
  })

  return fuse.search(query).map((result) => {
    const file = result.item
    const lines = file.content.split('\n')
    let bestLine = 1
    let bestScore = Infinity

    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].toLowerCase().includes(query.toLowerCase())) {
        const score = Math.abs(index - lines.length / 2)
        if (score < bestScore) {
          bestScore = score
          bestLine = index + 1
        }
      }
    }

    return {
      file: file.name,
      line: bestLine,
      column: 1,
      content: lines[bestLine - 1]?.trim() || '',
      match: query,
    }
  })
}

export function replaceInFile(content: string, search: string, replace: string, options: SearchOptions = {}): string {
  if (options.regex) {
    const flags = options.caseSensitive ? 'g' : 'gi'
    return content.replace(new RegExp(search, flags), replace)
  }

  if (options.wholeWord) {
    const flags = options.caseSensitive ? 'g' : 'gi'
    return content.replace(new RegExp(`\\b${escapeRegExp(search)}\\b`, flags), replace)
  }

  if (options.caseSensitive) {
    return content.split(search).join(replace)
  }

  return content.replace(new RegExp(escapeRegExp(search), 'gi'), replace)
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getFileOutline(content: string): { name: string; line: number; type: 'function' | 'class' | 'variable' }[] {
  const outline: { name: string; line: number; type: 'function' | 'class' | 'variable' }[] = []
  const lines = content.split('\n')
  const patterns = [
    { regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/, type: 'function' as const },
    { regex: /^(?:export\s+)?class\s+(\w+)/, type: 'class' as const },
    { regex: /^(?:export\s+)?const\s+(\w+)\s*[=:]/, type: 'variable' as const },
    { regex: /^(?:export\s+)?let\s+(\w+)\s*=/, type: 'variable' as const },
    { regex: /^(?:export\s+)?var\s+(\w+)\s*=/, type: 'variable' as const },
    { regex: /^(\w+)\s*[=:]\s*(?:async\s*)?\([^)]*\)\s*=>/, type: 'function' as const },
    { regex: /^(\w+)\s*[=:]\s*function\s*\(/, type: 'function' as const },
  ]

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    for (const { regex, type } of patterns) {
      const match = line.match(regex)
      if (match) {
        outline.push({ name: match[1], line: index + 1, type })
        break
      }
    }
  }

  return outline
}
