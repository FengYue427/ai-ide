import { gitignoreRulesFromSources } from './gitignoreService'
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

export type IndexBuildState = {
  status: IndexBuildStatus
  lastError: string | null
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

class ProjectIndexManager {
  private index: ProjectIndex = EMPTY_INDEX
  private stats: IndexBuildStats = EMPTY_STATS
  private version = 0
  private listeners = new Set<IndexListener>()
  private status: IndexBuildStatus = 'idle'
  private lastError: string | null = null
  private fileSignatures = new Map<string, string>()
  private syncQueued = false

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
    return { status: this.status, lastError: this.lastError }
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

  rebuild(
    editorFiles: { name: string; content: string; language?: string }[],
    workspaceFiles?: { path: string; content: string; language?: string }[],
  ): ProjectIndex {
    const { sources, stats } = collectIndexSourcesWithStats(editorFiles, workspaceFiles)
    this.stats = stats
    this.index = buildProjectIndex(sources)
    this.fileSignatures = new Map(
      sources.map((source) => [source.path, contentSignature(source.content)]),
    )
    this.status = 'ready'
    this.lastError = null
    clearSemanticSearchCache()
    this.emit()
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

  /** Debounced incremental sync — patches changed files instead of full rebuild when possible. */
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
        this.stats = stats
        this.index = buildProjectIndex(sources)
        this.fileSignatures = new Map(
          sources.map((source) => [source.path, contentSignature(source.content)]),
        )
        clearSemanticSearchCache()
        this.status = 'ready'
        this.lastError = null
        this.emit()
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

      if (changeCount >= FULL_REBUILD_MIN_CHANGES && changeCount / Math.max(1, this.index.files.length) > FULL_REBUILD_RATIO) {
        this.stats = stats
        this.index = buildProjectIndex(sources)
        this.fileSignatures = new Map(
          sources.map((source) => [source.path, contentSignature(source.content)]),
        )
        clearSemanticSearchCache()
      } else {
        this.stats = stats
        this.index = { ...this.index, builtAt: Date.now() }
        if (changeCount > 0) clearSemanticSearchCache()
      }

      this.status = 'ready'
      this.lastError = null
    } catch (error) {
      this.status = 'error'
      this.lastError = error instanceof Error ? error.message : String(error)
      console.error('[projectIndexManager] sync failed:', error)
    }

    this.emit()
  }

  forceRebuildFromWorkspace(editorFiles: { name: string; content: string; language?: string }[]): ProjectIndex {
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
}

export const projectIndexManager = new ProjectIndexManager()
