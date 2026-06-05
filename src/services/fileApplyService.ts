import type { FileItem } from '../types/file'
import { localProjectService } from './localProjectService'
import { normalizeProjectPath } from './localProjectPaths'
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

export interface ApplyChangesFailure {
  path: string
  reason: string
}

export interface ApplyChangesResult {
  applied: number
  failures: ApplyChangesFailure[]
  ok: boolean
}

async function syncToLocalDiskWithReason(path: string, content: string): Promise<string | null> {
  if (!localProjectService.isBound()) return null
  const normalized = normalizeProjectPath(path)
  if (!normalized) return null
  try {
    await localProjectService.writeFile(normalized, content)
    return null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

/** v1.3.7 — apply with per-file failure reasons for user-visible feedback. */
export async function applyChangesWithResult(changes: FileChangeInput[]): Promise<ApplyChangesResult> {
  const failures: ApplyChangesFailure[] = []
  let applied = 0
  let touched = false

  for (const change of changes) {
    const path = change.path.replace(/^\.\//, '')
    try {
      const existing = workspaceContextService.getFile(path)

      if (existing) {
        await workspaceContextService.updateFile(path, change.content)
      } else {
        const name = path.split('/').pop() || path
        await workspaceContextService.addFile({
          name,
          path,
          content: change.content,
          language: change.language,
          selected: true,
        })
      }

      const diskError = await syncToLocalDiskWithReason(path, change.content)
      if (diskError) {
        failures.push({ path, reason: diskError })
        continue
      }

      applied += 1
      touched = true
    } catch (error) {
      failures.push({
        path,
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (touched) {
    clearSemanticSearchCache()
  }

  return { applied, failures, ok: failures.length === 0 }
}

/** Mirror agent/editor file changes into the multi-file workspace store. */
export async function applyChangesToWorkspace(changes: FileChangeInput[]): Promise<void> {
  await applyChangesWithResult(changes)
}
