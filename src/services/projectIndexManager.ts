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
import { workspaceContextService } from './workspaceContextService'

type IndexListener = () => void

const EMPTY_INDEX: ProjectIndex = { files: [], builtAt: 0 }

const EMPTY_STATS: IndexBuildStats = {
  totalFiles: 0,
  eligibleFiles: 0,
  indexedFiles: 0,
  capped: false,
}

class ProjectIndexManager {
  private index: ProjectIndex = EMPTY_INDEX
  private stats: IndexBuildStats = EMPTY_STATS
  private version = 0
  private listeners = new Set<IndexListener>()

  getIndex(): ProjectIndex {
    return this.index
  }

  getVersion(): number {
    return this.version
  }

  getIndexStats(): IndexBuildStats {
    return this.stats
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

  patchFile(source: { path: string; content: string; language?: string }): void {
    this.index = patchIndexedFile(this.index, source)
    this.emit()
  }

  removeFile(path: string): void {
    this.index = removeIndexedFile(this.index, path)
    this.emit()
  }

  search(query: string, limit = 24): IndexSearchHit[] {
    return searchProjectIndex(this.index, query, limit)
  }
}

export const projectIndexManager = new ProjectIndexManager()
