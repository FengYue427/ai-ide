import type { FileItem } from '../types/file'
import { workspaceContextService } from './workspaceContextService'
import { clearSemanticSearchCache } from './semanticSearchService'

export interface FileChangeInput {
  path: string
  content: string
  language: string
}

function resolveFileIndex(files: FileItem[], path: string): number {
  const normalized = path.replace(/^\.\//, '')
  return files.findIndex(
    (file) =>
      file.name === normalized ||
      file.name.endsWith(`/${normalized}`) ||
      file.name === path,
  )
}

/** Merge agent or generated file changes into the open editor file list. */
export function applyChangesToFiles(prev: FileItem[], changes: FileChangeInput[]): FileItem[] {
  const next = [...prev]

  for (const change of changes) {
    const path = change.path.replace(/^\.\//, '')
    const index = resolveFileIndex(next, path)

    if (index >= 0) {
      next[index] = {
        ...next[index],
        content: change.content,
        language: change.language || next[index].language,
      }
    } else {
      next.push({
        name: path,
        content: change.content,
        language: change.language,
      })
    }
  }

  return next
}

export function getOldContentForPath(files: FileItem[], path: string): string {
  const index = resolveFileIndex(files, path.replace(/^\.\//, ''))
  return index >= 0 ? files[index].content : ''
}

/** Mirror agent/editor file changes into the multi-file workspace store. */
export async function applyChangesToWorkspace(changes: FileChangeInput[]): Promise<void> {
  let touched = false

  for (const change of changes) {
    const path = change.path.replace(/^\.\//, '')
    const existing = workspaceContextService.getFile(path)

    if (existing) {
      await workspaceContextService.updateFile(path, change.content)
      touched = true
      continue
    }

    const name = path.split('/').pop() || path
    await workspaceContextService.addFile({
      name,
      path,
      content: change.content,
      language: change.language,
      selected: true,
    })
    touched = true
  }

  if (touched) {
    clearSemanticSearchCache()
  }
}
