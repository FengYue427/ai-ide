/**
 * Local project root via File System Access API (IDE-4a-1).
 * Binds a user-selected directory for read/write on disk.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import {
  isPathIgnoredByGitignore,
  parseGitignore,
  type GitignoreRule,
} from './gitignoreService'
import { detectLanguageFromPath } from './projectIndexService'
import { isDesktopApp, getDesktopApi } from './desktopBridge'
import { normalizeProjectPath, splitParentAndName } from './localProjectPaths'
import type { DesktopOpenResult } from '../types/ai-ide-desktop'

const DB_NAME = 'ai-ide-local-project'
const DB_VERSION = 1
const HANDLE_KEY = 'root'

export const MAX_LOCAL_IMPORT_FILES = 500
export const MAX_LOCAL_FILE_BYTES = 1024 * 1024

export type LocalProjectFileEntry = {
  path: string
  content: string
  language: string
  size: number
}

export type LocalProjectOpenResult = {
  rootName: string
  imported: number
  skipped: number
  capped: boolean
  errors: string[]
  entries: LocalProjectFileEntry[]
}

export type LocalProjectStatus = {
  supported: boolean
  bound: boolean
  rootName: string | null
  permission: PermissionState | 'unknown'
}

interface LocalProjectDB extends DBSchema {
  handles: {
    key: string
    value: FileSystemDirectoryHandle
  }
}

let dbPromise: Promise<IDBPDatabase<LocalProjectDB>> | null = null
let rootHandle: FileSystemDirectoryHandle | null = null
let electronRootPath: string | null = null
let rootName: string | null = null
let cachedEntries: LocalProjectFileEntry[] = []

function useDesktopDisk(): boolean {
  return isDesktopApp() && Boolean(electronRootPath)
}

function applyDesktopScan(result: DesktopOpenResult): LocalProjectOpenResult {
  electronRootPath = result.rootPath
  rootName = result.rootName
  rootHandle = null
  cachedEntries = result.entries
  return {
    rootName: result.rootName,
    imported: result.imported,
    skipped: result.skipped,
    capped: result.capped,
    errors: result.errors,
    entries: result.entries,
  }
}

export function getElectronRootPath(): string | null {
  return electronRootPath
}

const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.turbo',
  'out',
])

async function getDb(): Promise<IDBPDatabase<LocalProjectDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LocalProjectDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles')
        }
      },
    })
  }
  return dbPromise
}

export function supportsLocalProject(): boolean {
  if (isDesktopApp()) return true
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

function isTextLike(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const binary = new Set([
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'ico',
    'zip',
    'gz',
    'wasm',
    'exe',
    'dll',
    'pdf',
    'mp3',
    'mp4',
  ])
  return !binary.has(ext)
}

async function ensurePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' as const }
  let perm = await handle.queryPermission(opts)
  if (perm === 'granted') return true
  if (perm === 'prompt') {
    perm = await handle.requestPermission(opts)
    return perm === 'granted'
  }
  return false
}

async function getDirectoryHandle(
  parts: string[],
  create: boolean,
): Promise<FileSystemDirectoryHandle | null> {
  if (!rootHandle) return null
  let current = rootHandle
  for (const part of parts) {
    try {
      current = await current.getDirectoryHandle(part, { create })
    } catch {
      return null
    }
  }
  return current
}

async function readGitignoreRules(dir: FileSystemDirectoryHandle): Promise<GitignoreRule[]> {
  try {
    const fileHandle = await dir.getFileHandle('.gitignore')
    const file = await fileHandle.getFile()
    const text = await file.text()
    return parseGitignore(text)
  } catch {
    return []
  }
}

async function walkDirectory(
  dir: FileSystemDirectoryHandle,
  prefix: string,
  rules: GitignoreRule[],
  out: { path: string; file: File }[],
  state: { count: number; capped: boolean },
): Promise<void> {
  if (state.capped) return

  for await (const [name, handle] of dir.entries()) {
    if (state.capped) break
    const relPath = prefix ? `${prefix}/${name}` : name

    if (handle.kind === 'directory') {
      if (DEFAULT_IGNORE_DIRS.has(name)) continue
      if (isPathIgnoredByGitignore(relPath + '/', rules)) continue
      await walkDirectory(handle as FileSystemDirectoryHandle, relPath, rules, out, state)
      continue
    }

    if (handle.kind !== 'file') continue
    if (!isTextLike(relPath)) continue
    if (isPathIgnoredByGitignore(relPath, rules)) continue

    if (state.count >= MAX_LOCAL_IMPORT_FILES) {
      state.capped = true
      break
    }

    try {
      const file = await (handle as FileSystemFileHandle).getFile()
      if (file.size > MAX_LOCAL_FILE_BYTES) continue
      out.push({ path: relPath.replace(/\\/g, '/'), file })
      state.count++
    } catch {
      // skip unreadable
    }
  }
}

async function persistHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await getDb()
  await db.put('handles', handle, HANDLE_KEY)
}

async function loadPersistedHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await getDb()
    return (await db.get('handles', HANDLE_KEY)) ?? null
  } catch {
    return null
  }
}

export const localProjectService = {
  getStatus(): LocalProjectStatus {
    return {
      supported: supportsLocalProject(),
      bound: Boolean(rootHandle) || Boolean(electronRootPath),
      rootName,
      permission: useDesktopDisk() ? 'granted' : 'unknown',
    }
  },

  isBound(): boolean {
    return Boolean(rootHandle) || Boolean(electronRootPath)
  },

  getRootName(): string | null {
    return rootName
  },

  async openProjectPicker(): Promise<LocalProjectOpenResult> {
    if (!supportsLocalProject()) {
      throw new Error('LOCAL_PROJECT_UNSUPPORTED')
    }

    if (isDesktopApp()) {
      const api = getDesktopApi()
      if (!api) throw new Error('LOCAL_PROJECT_UNSUPPORTED')
      const picked = await api.pickProjectFolder()
      if (!picked) throw new Error('LOCAL_PROJECT_CANCELLED')
      return applyDesktopScan(picked)
    }

    const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
    const ok = await ensurePermission(handle)
    if (!ok) throw new Error('LOCAL_PROJECT_PERMISSION_DENIED')

    rootHandle = handle
    rootName = handle.name
    await persistHandle(handle)

    return this.scanProject()
  },

  async restorePersistedProject(): Promise<LocalProjectOpenResult | null> {
    if (!supportsLocalProject()) return null

    if (isDesktopApp()) {
      const api = getDesktopApi()
      if (!api) return null
      const restored = await api.restoreLastProject()
      if (!restored) return null
      return applyDesktopScan(restored)
    }

    const handle = await loadPersistedHandle()
    if (!handle) return null

    const ok = await ensurePermission(handle)
    if (!ok) return null

    rootHandle = handle
    rootName = handle.name
    return this.scanProject()
  },

  async scanProject(): Promise<LocalProjectOpenResult> {
    if (useDesktopDisk() && electronRootPath) {
      const api = getDesktopApi()
      if (!api) {
        return { rootName: '', imported: 0, skipped: 0, capped: false, errors: [], entries: [] }
      }
      const scanned = await api.scanProject(electronRootPath)
      return applyDesktopScan(scanned)
    }

    if (!rootHandle || !rootName) {
      return { rootName: '', imported: 0, skipped: 0, capped: false, errors: [], entries: [] }
    }

    const collected: { path: string; file: File }[] = []
    const state = { count: 0, capped: false }
    const rootRules = await readGitignoreRules(rootHandle)

    try {
      await walkDirectory(rootHandle, '', rootRules, collected, state)
    } catch (e) {
      return {
        rootName,
        imported: 0,
        skipped: 0,
        capped: false,
        errors: [e instanceof Error ? e.message : String(e)],
        entries: [],
      }
    }

    const entries: LocalProjectFileEntry[] = []
    const errors: string[] = []

    for (const { path, file } of collected) {
      try {
        const content = await file.text()
        entries.push({
          path,
          content,
          language: detectLanguageFromPath(path),
          size: file.size,
        })
      } catch (e) {
        errors.push(`${path}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    cachedEntries = entries

    return {
      rootName,
      imported: entries.length,
      skipped: errors.length,
      capped: state.capped,
      errors,
      entries,
    }
  },

  getCachedEntries(): LocalProjectFileEntry[] {
    return cachedEntries
  },

  async listFiles(options?: { max?: number; glob?: string }): Promise<string[]> {
    let paths = cachedEntries.map((e) => e.path)
    const glob = options?.glob?.trim()
    if (glob) {
      const re = globToRegExp(glob)
      paths = paths.filter((p) => re.test(p))
    }
    const max = options?.max ?? 200
    return paths.slice(0, max)
  },

  async readFile(path: string, startLine?: number, endLine?: number): Promise<string> {
    const normalized = normalizeProjectPath(path)
    if (!normalized) throw new Error('INVALID_PATH')

    if (useDesktopDisk() && electronRootPath) {
      const api = getDesktopApi()
      if (!api) throw new Error('LOCAL_PROJECT_NOT_BOUND')
      return api.readFile(electronRootPath, normalized, startLine, endLine)
    }

    if (!rootHandle) {
      throw new Error('LOCAL_PROJECT_NOT_BOUND')
    }

    const split = splitParentAndName(normalized)
    if (!split) throw new Error('INVALID_PATH')

    const dir = await getDirectoryHandle(split.parentParts, false)
    if (!dir) throw new Error('FILE_NOT_FOUND')

    const fileHandle = await dir.getFileHandle(split.name, { create: false })
    const file = await fileHandle.getFile()
    const text = await file.text()

    if (startLine === undefined && endLine === undefined) return text

    const lines = text.split(/\r?\n/)
    const start = Math.max(1, startLine ?? 1)
    const end = Math.min(lines.length, endLine ?? lines.length)
    return lines.slice(start - 1, end).join('\n')
  },

  async writeFile(path: string, content: string): Promise<void> {
    const normalized = normalizeProjectPath(path)
    if (!normalized) throw new Error('INVALID_PATH')

    if (useDesktopDisk() && electronRootPath) {
      const api = getDesktopApi()
      if (!api) throw new Error('LOCAL_PROJECT_NOT_BOUND')
      await api.writeFile(electronRootPath, normalized, content)
      const lang = detectLanguageFromPath(normalized)
      const entry: LocalProjectFileEntry = {
        path: normalized,
        content,
        language: lang,
        size: new Blob([content]).size,
      }
      const existing = cachedEntries.findIndex((e) => e.path === normalized)
      if (existing >= 0) cachedEntries[existing] = entry
      else cachedEntries.push(entry)
      return
    }

    if (!rootHandle) throw new Error('LOCAL_PROJECT_NOT_BOUND')

    const ok = await ensurePermission(rootHandle)
    if (!ok) throw new Error('LOCAL_PROJECT_PERMISSION_DENIED')

    const split = splitParentAndName(normalized)
    if (!split) throw new Error('INVALID_PATH')

    const dir = await getDirectoryHandle(split.parentParts, true)
    if (!dir) throw new Error('CANNOT_CREATE_DIR')

    const fileHandle = await dir.getFileHandle(split.name, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()

    const lang = detectLanguageFromPath(normalized)
    const existing = cachedEntries.findIndex((e) => e.path === normalized)
    const entry: LocalProjectFileEntry = {
      path: normalized,
      content,
      language: lang,
      size: new Blob([content]).size,
    }
    if (existing >= 0) cachedEntries[existing] = entry
    else cachedEntries.push(entry)
  },

  unbind(): void {
    rootHandle = null
    electronRootPath = null
    rootName = null
    cachedEntries = []
    void getDb().then((db) => db.delete('handles', HANDLE_KEY))
  },
}

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§')
    .replace(/\*/g, '[^/]*')
    .replace(/§§/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${escaped}$`, 'i')
}
