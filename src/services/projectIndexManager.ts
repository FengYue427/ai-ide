import {
  buildProjectIndex,
  collectIndexSources,
  patchIndexedFile,
  removeIndexedFile,
  searchProjectIndex,
  type IndexSearchHit,
  type ProjectIndex,
} from './projectIndexService'
import { workspaceContextService } from './workspaceContextService'

type IndexListener = () => void

const EMPTY_INDEX: ProjectIndex = { files: [], builtAt: 0 }

class ProjectIndexManager {
  private index: ProjectIndex = EMPTY_INDEX
  private version = 0
  private listeners = new Set<IndexListener>()

  getIndex(): ProjectIndex {
    return this.index
  }

  getVersion(): number {
    return this.version
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
    const sources = collectIndexSources(editorFiles, workspaceFiles)
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
