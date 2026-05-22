/**
 * Lightweight project index (files + symbols) for @-search and AI context.
 * Not a full LSP — regex-based symbol extraction for browser-scale workspaces.
 */

import {
  gitignoreRulesFromSources,
  isPathIgnoredByGitignore,
  type GitignoreRule,
} from './gitignoreService'
import { capIndexSources, type IndexSource } from './indexLimits'

export type SymbolKind =
  | 'function'
  | 'class'
  | 'interface'
  | 'type'
  | 'const'
  | 'enum'
  | 'method'
  | 'unknown'

export interface IndexedSymbol {
  name: string
  kind: SymbolKind
  path: string
  line: number
}

export interface IndexedFile {
  path: string
  language: string
  symbols: IndexedSymbol[]
}

export interface ProjectIndex {
  files: IndexedFile[]
  builtAt: number
}

export type IndexBuildStats = {
  totalFiles: number
  eligibleFiles: number
  indexedFiles: number
  capped: boolean
}

export function buildIndexSourcesWithStats(
  merged: IndexSource[],
  gitignoreRules: GitignoreRule[] = gitignoreRulesFromSources(merged),
): { sources: IndexSource[]; stats: IndexBuildStats } {
  const eligible = merged.filter((file) => shouldIndexPath(file.path, gitignoreRules))
  const sources = capIndexSources(eligible)

  return {
    sources,
    stats: {
      totalFiles: merged.length,
      eligibleFiles: eligible.length,
      indexedFiles: sources.length,
      capped: sources.length < eligible.length,
    },
  }
}

export interface IndexSearchHit {
  type: 'file' | 'symbol'
  path: string
  name: string
  kind?: SymbolKind
  line?: number
  score: number
}

const SYMBOL_PATTERNS: { kind: SymbolKind; pattern: RegExp }[] = [
  { kind: 'function', pattern: /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/ },
  { kind: 'method', pattern: /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/ },
  { kind: 'class', pattern: /^\s*(?:export\s+)?class\s+(\w+)/ },
  { kind: 'interface', pattern: /^\s*(?:export\s+)?interface\s+(\w+)/ },
  { kind: 'type', pattern: /^\s*(?:export\s+)?type\s+(\w+)/ },
  { kind: 'enum', pattern: /^\s*(?:export\s+)?enum\s+(\w+)/ },
  { kind: 'const', pattern: /^\s*(?:export\s+)?const\s+(\w+)\s*=/ },
]

export function detectLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    vue: 'vue',
    svelte: 'svelte',
  }
  return map[ext] ?? 'plaintext'
}

export function extractSymbolsFromContent(path: string, content: string): IndexedSymbol[] {
  const lines = content.split(/\r?\n/)
  const seen = new Set<string>()
  const symbols: IndexedSymbol[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const { kind, pattern } of SYMBOL_PATTERNS) {
      const match = line.match(pattern)
      if (!match?.[1]) continue
      const name = match[1]
      if (name.length < 2 || seen.has(name)) continue
      seen.add(name)
      symbols.push({ name, kind, path, line: i + 1 })
      break
    }
  }

  return symbols.slice(0, 200)
}

const DEFAULT_IGNORE_SEGMENTS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.turbo',
  '.vercel',
  '__pycache__',
  '.cache',
  'vendor',
  'target',
])

/** Skip dependency/build dirs when indexing browser workspaces. */
export function shouldIndexPath(path: string, gitignoreRules: GitignoreRule[] = []): boolean {
  const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '')
  const parts = normalized.split('/').filter(Boolean)
  if (parts.some((part) => DEFAULT_IGNORE_SEGMENTS.has(part))) return false
  if (gitignoreRules.length > 0 && isPathIgnoredByGitignore(normalized, gitignoreRules)) {
    return false
  }
  return true
}

export function buildProjectIndex(
  sources: { path: string; content: string; language?: string }[],
): ProjectIndex {
  const { sources: indexable, stats: _stats } = buildIndexSourcesWithStats(sources)
  const files: IndexedFile[] = indexable.map((source) => ({
      path: source.path,
      language: source.language ?? detectLanguageFromPath(source.path),
      symbols: extractSymbolsFromContent(source.path, source.content),
    }))

  return { files, builtAt: Date.now() }
}

export function patchIndexedFile(
  index: ProjectIndex,
  source: { path: string; content: string; language?: string },
  gitignoreRules: GitignoreRule[] = [],
): ProjectIndex {
  if (!shouldIndexPath(source.path, gitignoreRules)) {
    return removeIndexedFile(index, source.path)
  }

  const nextFile: IndexedFile = {
    path: source.path,
    language: source.language ?? detectLanguageFromPath(source.path),
    symbols: extractSymbolsFromContent(source.path, source.content),
  }

  const files = index.files.filter((file) => file.path !== source.path)
  files.push(nextFile)

  return { files, builtAt: Date.now() }
}

export function removeIndexedFile(index: ProjectIndex, path: string): ProjectIndex {
  return {
    files: index.files.filter((file) => file.path !== path),
    builtAt: Date.now(),
  }
}

function scoreMatch(query: string, target: string): number {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 50
  return 0
}

export function searchProjectIndex(
  index: ProjectIndex,
  query: string,
  limit = 24,
): IndexSearchHit[] {
  const q = query.trim().replace(/^@+/, '')
  if (!q) return []

  const hits: IndexSearchHit[] = []

  for (const file of index.files) {
    const fileScore = scoreMatch(q, file.path)
    if (fileScore > 0) {
      hits.push({ type: 'file', path: file.path, name: file.path.split('/').pop() ?? file.path, score: fileScore })
    }
    for (const symbol of file.symbols) {
      const symbolScore = scoreMatch(q, symbol.name)
      if (symbolScore > 0) {
        hits.push({
          type: 'symbol',
          path: file.path,
          name: symbol.name,
          kind: symbol.kind,
          line: symbol.line,
          score: symbolScore + 10,
        })
      }
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function collectIndexSources(
  editorFiles: { name: string; content: string; language?: string }[],
  workspaceFiles: { path: string; content: string; language?: string }[] = [],
): { path: string; content: string; language?: string }[] {
  const byPath = new Map<string, { path: string; content: string; language?: string }>()

  for (const file of workspaceFiles) {
    byPath.set(file.path, file)
  }
  for (const file of editorFiles) {
    byPath.set(file.name, {
      path: file.name,
      content: file.content,
      language: file.language,
    })
  }

  const merged = [...byPath.values()]
  return buildIndexSourcesWithStats(merged).sources
}

export function collectIndexSourcesWithStats(
  editorFiles: { name: string; content: string; language?: string }[],
  workspaceFiles: { path: string; content: string; language?: string }[] = [],
): { sources: { path: string; content: string; language?: string }[]; stats: IndexBuildStats } {
  const byPath = new Map<string, { path: string; content: string; language?: string }>()
  for (const file of workspaceFiles) byPath.set(file.path, file)
  for (const file of editorFiles) {
    byPath.set(file.name, { path: file.name, content: file.content, language: file.language })
  }
  return buildIndexSourcesWithStats([...byPath.values()])
}

