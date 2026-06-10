import type { ApiErrorKey } from '../i18n/apiMessages'
import {
  MAX_FILE_CONTENT_LEN,
  MAX_FILE_NAME_LEN,
  sanitizeWorkspaceFilesForCloud,
  type WorkspaceFileLike,
} from './workspacePayload'

export const MAX_SHARE_BODY_BYTES = 400_000
export const MAX_SHARE_FILES = 50

export type ShareFilePayload = {
  name: string
  content: string
  language: string
}

function normalizeShareFile(raw: unknown): WorkspaceFileLike | null {
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as { name?: unknown; content?: unknown; language?: unknown }
  if (typeof entry.name !== 'string' || typeof entry.content !== 'string') return null
  const name = entry.name.trim()
  if (!name || name.length > MAX_FILE_NAME_LEN) return null
  if (entry.content.length > MAX_FILE_CONTENT_LEN) return null
  return { name, content: entry.content }
}

export function validateSharePayload(
  files: unknown,
): { ok: true; files: ShareFilePayload[] } | { ok: false; key: ApiErrorKey } {
  if (!Array.isArray(files) || files.length === 0) {
    return { ok: false, key: 'api.share.filesRequired' }
  }
  if (files.length > MAX_SHARE_FILES) {
    return { ok: false, key: 'api.share.tooManyFiles' }
  }

  const normalized: WorkspaceFileLike[] = []
  for (const raw of files) {
    const file = normalizeShareFile(raw)
    if (!file) return { ok: false, key: 'api.share.invalidFile' }
    normalized.push(file)
  }

  const sanitized = sanitizeWorkspaceFilesForCloud(normalized)
  if (sanitized.files.length === 0) {
    return { ok: false, key: 'api.share.payloadTooLarge' }
  }

  const bodyBytes = new TextEncoder().encode(JSON.stringify(sanitized.files)).length
  if (bodyBytes > MAX_SHARE_BODY_BYTES) {
    return { ok: false, key: 'api.share.payloadTooLarge' }
  }

  return {
    ok: true,
    files: sanitized.files.map((file, index) => ({
      name: file.name,
      content: file.content,
      language:
        typeof (files[index] as { language?: unknown })?.language === 'string'
          ? String((files[index] as { language: string }).language)
          : 'plaintext',
    })),
  }
}
