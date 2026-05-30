import type { ApiErrorKey } from '../i18n/apiMessages'

export const MAX_WORKSPACE_BODY_BYTES = 2_000_000
export const MAX_WORKSPACE_FILES = 200
export const MAX_FILE_NAME_LEN = 200
export const MAX_FILE_CONTENT_LEN = 200_000

/** Skip common binary assets from cloud autosave (v1.1.3.9). */
const BINARY_FILE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.bmp',
  '.zip',
  '.gz',
  '.tar',
  '.7z',
  '.rar',
  '.pdf',
  '.wasm',
  '.mp3',
  '.mp4',
  '.mov',
  '.avi',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
])

export type WorkspaceFileLike = {
  name: string
  content: string
}

export type WorkspaceSanitizeSummary = {
  kept: number
  omittedOversized: number
  omittedBinary: number
  omittedInvalidName: number
  droppedForCount: number
  droppedForBodyBytes: number
}

export type WorkspaceSanitizeResult<T extends WorkspaceFileLike> = {
  files: T[]
  summary: WorkspaceSanitizeSummary
}

function isBinaryAssetPath(name: string): boolean {
  const lower = name.trim().toLowerCase()
  const dot = lower.lastIndexOf('.')
  if (dot < 0) return false
  return BINARY_FILE_EXTENSIONS.has(lower.slice(dot))
}

function isValidWorkspaceFileName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_FILE_NAME_LEN
}

export function estimateWorkspacePayloadBytes(
  files: WorkspaceFileLike[],
  settings?: unknown,
): number {
  const filesStr = JSON.stringify(files)
  const settingsStr = JSON.stringify(settings ?? {})
  return new TextEncoder().encode(filesStr).length + new TextEncoder().encode(settingsStr).length
}

/**
 * Trim files before cloud PUT to avoid 413 (v1.1.3.9).
 * Local IndexedDB autosave keeps full workspace; only cloud sync is trimmed.
 */
export function sanitizeWorkspaceFilesForCloud<T extends WorkspaceFileLike>(
  files: T[],
): WorkspaceSanitizeResult<T> {
  const summary: WorkspaceSanitizeSummary = {
    kept: 0,
    omittedOversized: 0,
    omittedBinary: 0,
    omittedInvalidName: 0,
    droppedForCount: 0,
    droppedForBodyBytes: 0,
  }

  const eligible: T[] = []
  for (const file of files) {
    if (!isValidWorkspaceFileName(file.name)) {
      summary.omittedInvalidName++
      continue
    }
    if (isBinaryAssetPath(file.name)) {
      summary.omittedBinary++
      continue
    }
    if (typeof file.content !== 'string' || file.content.length > MAX_FILE_CONTENT_LEN) {
      summary.omittedOversized++
      continue
    }
    eligible.push(file)
  }

  let kept = eligible.slice(0, MAX_WORKSPACE_FILES)
  if (eligible.length > MAX_WORKSPACE_FILES) {
    summary.droppedForCount = eligible.length - MAX_WORKSPACE_FILES
  }

  while (kept.length > 0 && estimateWorkspacePayloadBytes(kept, {}) > MAX_WORKSPACE_BODY_BYTES) {
    kept = kept.slice(0, -1)
    summary.droppedForBodyBytes++
  }

  summary.kept = kept.length
  return { files: kept, summary }
}

export function workspaceSanitizeHadOmissions(summary: WorkspaceSanitizeSummary): boolean {
  return (
    summary.omittedOversized > 0 ||
    summary.omittedBinary > 0 ||
    summary.omittedInvalidName > 0 ||
    summary.droppedForCount > 0 ||
    summary.droppedForBodyBytes > 0
  )
}

export type WorkspacePayloadError = {
  key: ApiErrorKey
  params?: Record<string, string | number>
}

export function validateWorkspacePayload(
  files: unknown,
  settings: unknown,
): WorkspacePayloadError | null {
  const filesStr = typeof files === 'string' ? files : null
  const settingsStr = typeof settings === 'string' ? settings : null

  if (filesStr && filesStr.length > MAX_WORKSPACE_BODY_BYTES) {
    return { key: 'api.workspace.filesFieldTooLarge' }
  }
  if (settingsStr && settingsStr.length > MAX_WORKSPACE_BODY_BYTES) {
    return { key: 'api.workspace.settingsFieldTooLarge' }
  }

  if (!filesStr && Array.isArray(files)) {
    if (files.length > MAX_WORKSPACE_FILES) {
      return { key: 'api.workspace.fileCountExceeded', params: { max: MAX_WORKSPACE_FILES } }
    }
    for (const item of files) {
      if (!item || typeof item !== 'object') return { key: 'api.workspace.filesInvalid' }
      const name = (item as { name?: unknown }).name
      const content = (item as { content?: unknown }).content
      if (typeof name !== 'string' || !name.trim() || name.length > MAX_FILE_NAME_LEN) {
        return { key: 'api.workspace.fileNameInvalid' }
      }
      if (typeof content !== 'string' || content.length > MAX_FILE_CONTENT_LEN) {
        return { key: 'api.workspace.fileContentTooLarge' }
      }
    }
  }

  if (!settingsStr && settings != null && typeof settings !== 'object') {
    return { key: 'api.workspace.settingsInvalid' }
  }

  return null
}
