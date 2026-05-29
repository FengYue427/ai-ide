import type { WorkspaceFileRecord } from './backgroundJobCloudWriteback'
import type { BackgroundJobPendingChange } from './backgroundJobTypes'

function normalizePath(path: string): string | null {
  const trimmed = path.replace(/\\/g, '/').replace(/^\.\//, '').trim()
  if (!trimmed || /\.\.|^\/|\\/.test(trimmed)) return null
  const parts = trimmed.split('/').filter((p) => p && p !== '.')
  if (parts.some((p) => p === '..')) return null
  return parts.join('/')
}

export function detectLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    json: 'json',
    md: 'markdown',
    css: 'css',
    html: 'html',
    vue: 'vue',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    sql: 'sql',
    yml: 'yaml',
    yaml: 'yaml',
  }
  return map[ext] ?? 'plaintext'
}

type FileEntry = { content: string; language: string }

/** In-memory cloud workspace for server-side background agent tools. */
export class BackgroundAgentWorkspace {
  private readonly files = new Map<string, FileEntry>()
  private readonly initialContent = new Map<string, string>()

  constructor(records: WorkspaceFileRecord[]) {
    for (const record of records) {
      const path = normalizePath(record.name)
      if (!path) continue
      const language = record.language ?? detectLanguageFromPath(path)
      this.files.set(path, { content: record.content, language })
      this.initialContent.set(path, record.content)
    }
  }

  listPaths(glob?: string, max = 100): string[] {
    let paths = [...this.files.keys()].sort()
    if (glob?.trim()) {
      const norm = glob.replace(/\\/g, '/')
      const reSource = norm
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*\/?/g, '(?:.*/)?')
        .replace(/\*/g, '[^/]*')
      const re = new RegExp(`^${reSource}$`, 'i')
      paths = paths.filter((p) => re.test(p))
    }
    return paths.slice(0, Math.min(max, 200))
  }

  readFile(path: string, startLine?: number, endLine?: number): string {
    const normalized = normalizePath(path)
    if (!normalized) throw new Error('INVALID_PATH')
    const file = this.files.get(normalized)
    if (!file) throw new Error(`FILE_NOT_FOUND: ${normalized}`)

    if (startLine === undefined && endLine === undefined) return file.content
    const lines = file.content.split(/\r?\n/)
    const s = Math.max(1, startLine ?? 1)
    const e = Math.min(lines.length, endLine ?? lines.length)
    return lines.slice(s - 1, e).join('\n')
  }

  writeFile(path: string, content: string): void {
    const normalized = normalizePath(path)
    if (!normalized) throw new Error('INVALID_PATH')
    if (content.length > 512_000) throw new Error('CONTENT_TOO_LARGE')

    const language = detectLanguageFromPath(normalized)
    this.files.set(normalized, { content, language })
    if (!this.initialContent.has(normalized)) {
      this.initialContent.set(normalized, '')
    }
  }

  getPendingChanges(): BackgroundJobPendingChange[] {
    const changes: BackgroundJobPendingChange[] = []
    for (const [path, file] of this.files) {
      const before = this.initialContent.get(path)
      if (before === undefined) {
        changes.push({ path, content: file.content, language: file.language })
        continue
      }
      if (before !== file.content) {
        changes.push({ path, content: file.content, language: file.language })
      }
    }
    return changes
  }

  summarize(maxChars = 12_000): string {
    const paths = this.listPaths(undefined, 200)
    const lines = [`Files (${paths.length}):`, ...paths.slice(0, 80)]
    if (paths.length > 80) lines.push(`… and ${paths.length - 80} more`)
    const text = lines.join('\n')
    if (text.length <= maxChars) return text
    return `${text.slice(0, maxChars)}…`
  }
}
