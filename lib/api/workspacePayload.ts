import type { ApiErrorKey } from '../i18n/apiMessages'

const MAX_WORKSPACE_BODY_BYTES = 2_000_000
const MAX_WORKSPACE_FILES = 200
const MAX_FILE_NAME_LEN = 200
const MAX_FILE_CONTENT_LEN = 200_000

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
