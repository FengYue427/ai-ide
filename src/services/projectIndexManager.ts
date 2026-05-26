import { gitignoreRulesFromSources } from './gitignoreService'
import { getMaxIndexFiles } from './indexLimits'
import { assembleProjectIndex } from './projectIndexBuildCore'
import {
  buildProjectIndex,
  collectIndexSourcesWithStats,
  patchIndexedFile,
  removeIndexedFile,
  searchProjectIndex,
  type IndexBuildStats,
  type IndexSearchHit,
  type ProjectIndex,
} from './projectIndexService'
import { clearSemanticSearchCache } from './semanticSearchService'
import { workspaceContextService } from './workspaceContextService'

type IndexListener = () => void

export type IndexBuildStatus = 'idle' | 'building' | 'ready' | 'error'

export type IndexBuildProgress = { indexed: number; total: number }

export type IndexBuildState = {
  status: IndexBuildStatus
  lastError: string | null
  progress: IndexBuildProgress | null
}

const EMPTY_INDEX: ProjectIndex = { files: [], builtAt: 0 }

const EMPTY_STATS: IndexBuildStats = {
  totalFiles: 0,
  eligibleFiles: 0,
  indexedFiles: 0,
  capped: false,
}

const FULL_REBUILD_RATIO = 0.35
const FULL_REBUILD_MIN_CHANGES = 12
const WORKER_MIN_SOURCES = 80

function contentSignature(content: string): string {
  return `${content.length}:${content.slice(0, 48)}`
}

function runWhenIdle(fn: () => void): void {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => fn(), { timeout: 1500 })
  } else {
    setTimeout(fn, 0)
  }
}

function shouldUseIndexWorker(sourceCount: number): boolean {
  if (typeof Worker === 'undefined') return false
  if (sourceCount < WORKER_MIN_SOURCES) return false
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') return false
  return true
}

type IndexSourceRow = { path: string; content: string; language?: string }

class ProjectIndexManager {
  private index: ProjectIndex = EMPTY_INDEX
  private stats: IndexBuildStats = EMPTY_STATS
  private version = 0
  private listeners = new Set<IndexListener>()
  private status: IndexBuildStatus = 'idle'
  private lastError: string | null = null
  private progress: IndexBuildProgress | null = null
  private fileSignatures = new Map<string, string>()
  private syncQueued = false
  private buildGeneration = 0
  private worker: Worker | null = null

  getIndex(): ProjectIndex {
    return this.index
  }

  getVersion(): number {
    return this.version
  }

  getIndexStats(): IndexBuildStats {
    return this.stats
  }

  getBuildState(): IndexBuildState {
    return { status: this.status, lastError: this.lastError, progress: this.progress }
  }

  subscribe(listener: IndexListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit() {
    this.version += 1
    this.listeners.forEach((listener) => {
      try {
        listener()
      } catch (error) {
        console.error('[projectIndexManager] listener error:', error)
      }
    })
  }

  private terminateWorker(): void {
    this.worker?.terminate()
    this.worker = null
  }

  private finishBuild(sources: IndexSourceRow[], index: ProjectIndex, stats: IndexBuildStats): void {
    this.stats = stats
    this.index = index
    this.fileSignatures = new Map(
      sources.map((source) => [source.path, contentSignature(source.content)]),
    )
    this.status = 'ready'
    this.lastError = null
    this.progress = null
    clearSemanticSearchCache()
    this.emit()
  }

  private buildWithWorker(sources: IndexSourceRow[], stats: IndexBuildStats): boolean {
    if (!shouldUseIndexWorker(sources.length)) return false

    const generation = ++this.buildGeneration
    this.terminateWorker()
    this.status = 'building'
    this.progress = { indexed: 0, total: sources.length }
    this.stats = stats
    this.emit()

    try {
      this.worker = new Worker(new URL('../workers/projectIndex.worker.ts', import.meta.url), {
        type: 'module',
      })
    } catch (error) {
      console.warn('[projectIndexManager] worker unavailable, falling back to main thread:', error)
      return false
    }

    this.worker.onmessage = (event: MessageEvent) => {
      if (generation !== this.buildGeneration) return

      const data = event.data as
        | { type: 'progress'; indexed: number; total: number }
        | { type: 'done'; files: ProjectIndex['files'] }
        | { type: 'error'; message: string }

      if (data.type === 'progress') {
        this.progress = { indexed: data.indexed, total: data.total }
        this.emit()
        return
      }

      this.terminateWorker()

      if (data.type === 'error') {
        this.status = 'error'
        this.lastError = data.message
        this.progress = null
        this.emit()
        return
      }

      this.finishBuild(sources, assembleProjectIndex(data.files), stats)
    }

    this.worker.onerror = () => {
      if (generation !== this.buildGeneration) return
      this.terminateWorker()
      this.status = 'error'
      this.lastError = 'Index worker failed'
      this.progress = null
      this.emit()
    }

    this.worker.postMessage({ type: 'build', sources })
    return true
  }

  rebuild(
    editorFiles: { name: string; content: string; language?: string }[],
    workspaceFiles?: { path: string; content: string; language?: string }[],
  ): ProjectIndex {
    const { sources, stats } = collectIndexSourcesWithStats(editorFiles, workspaceFiles)
    if (this.buildWithWorker(sources, stats)) {
      return this.index
    }
    this.finishBuild(sources, buildProjectIndex(sources), stats)
    return this.index
  }

  rebuildFromWorkspace(editorFiles: { name: string; content: string; language?: string }[]): ProjectIndex {
    const workspaceFiles = workspaceContextService.getAllFiles().map((file) => ({
      path: file.path,
      content: file.content,
      language: file.language,
    }))
    return this.rebuild(editorFiles, workspaceFiles)
  }

  scheduleSyncFromWorkspace(editorFiles: { name: string; content: string; language?: string }[]): void {
    this.pendingEditorFiles = editorFiles
    if (this.syncQueued) return
    this.syncQueued = true
    runWhenIdle(() => {
      this.syncQueued = false
      const files = this.pendingEditorFiles
      this.pendingEditorFiles = null
      if (files) this.syncFromWorkspace(files)
    })
  }

  private pendingEditorFiles: { name: string; content: string; language?: string }[] | null = null

  syncFromWorkspace(editorFiles: { name: string; content: string; language?: string }[]): void {
    this.status = 'building'
    this.progress = null
    this.emit()

    try {
      const workspaceFiles = workspaceContextService.getAllFiles().map((file) => ({
        path: file.path,
        content: file.content,
        language: file.language,
      }))

      const { sources, stats } = collectIndexSourcesWithStats(editorFiles, workspaceFiles)
      const mergedForRules = [
        ...workspaceFiles.map((f) => ({ path: f.path, content: f.content })),
        ...editorFiles.map((f) => ({ path: f.name, content: f.content })),
      ]
      const gitignoreRules = gitignoreRulesFromSources(mergedForRules)

      if (this.index.files.length === 0) {
        if (this.buildWithWorker(sources, stats)) return
        this.finishBuild(sources, buildProjectIndex(sources), stats)
        return
      }

      const sourcePaths = new Set(sources.map((source) => source.path))
      let changeCount = 0

      for (const file of [...this.index.files]) {
        if (!sourcePaths.has(file.path)) {
          this.index = removeIndexedFile(this.index, file.path)
          this.fileSignatures.delete(file.path)
          changeCount += 1
        }
      }

      for (const source of sources) {
        const sig = contentSignature(source.content)
        if (this.fileSignatures.get(source.path) === sig) continue
        this.index = patchIndexedFile(this.index, source, gitignoreRules)
        this.fileSignatures.set(source.path, sig)
        changeCount += 1
      }

      const needsFullRebuild =
        changeCount >= FULL_REBUILD_MIN_CHANGES &&
        changeCount / Math.max(1, this.index.files.length) > FULL_REBUILD_RATIO

      if (needsFullRebuild) {
        if (this.buildWithWorker(sources, stats)) return
        this.finishBuild(sources, buildProjectIndex(sources), stats)
        return
      }

      this.stats = stats
      this.index = { ...this.index, builtAt: Date.now() }
      if (changeCount > 0) clearSemanticSearchCache()
      this.status = 'ready'
      this.lastError = null
      this.progress = null
    } catch (error) {
      this.status = 'error'
      this.lastError = error instanceof Error ? error.message : String(error)
      this.progress = null
      console.error('[projectIndexManager] sync failed:', error)
    }

    this.emit()
  }

  forceRebuildFromWorkspace(editorFiles: { name: string; content: string; language?: string }[]): ProjectIndex {
    this.buildGeneration += 1
    this.terminateWorker()
    return this.rebuildFromWorkspace(editorFiles)
  }

  patchFile(source: { path: string; content: string; language?: string }): void {
    this.index = patchIndexedFile(this.index, source)
    this.fileSignatures.set(source.path, contentSignature(source.content))
    this.stats = {
      ...this.stats,
      indexedFiles: this.index.files.length,
    }
    this.emit()
  }

  removeFile(path: string): void {
    this.index = removeIndexedFile(this.index, path)
    this.fileSignatures.delete(path)
    this.stats = {
      ...this.stats,
      indexedFiles: this.index.files.length,
    }
    this.emit()
  }

  search(query: string, limit = 24): IndexSearchHit[] {
    return searchProjectIndex(this.index, query, limit)
  }

  /** Exposed for docs/tests — current cap from indexLimits. */
  getMaxFilesCap(): number {
    return getMaxIndexFiles()
  }
}

export const projectIndexManager = new ProjectIndexManager()
