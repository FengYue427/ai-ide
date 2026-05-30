import { collabRoleCanWrite } from './collabPermissions'
import { formatService } from '../services/formatService'
import { useIDEStore } from '../store/ideStore'
import type { FileItem } from '../types/file'

const FORMATTABLE_EXTENSIONS = new Set([
  'js',
  'jsx',
  'ts',
  'tsx',
  'css',
  'json',
  'md',
  'html',
  'htm',
])

const FORMATTABLE_LANGUAGES = new Set([
  'javascript',
  'typescript',
  'javascriptreact',
  'typescriptreact',
  'css',
  'json',
  'markdown',
  'html',
])

export function canFormatFile(file: Pick<FileItem, 'name' | 'language'>): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext && FORMATTABLE_EXTENSIONS.has(ext)) return true
  return FORMATTABLE_LANGUAGES.has(file.language)
}

export function isEditorWritableForFormat(state: {
  collaborationRoomId: string | null
  collaborationMemberRole: string | null
}): boolean {
  if (!state.collaborationRoomId) return true
  return collabRoleCanWrite(state.collaborationMemberRole)
}

export async function formatFileContent(content: string, language: string): Promise<string> {
  return formatService.formatCode(content, language)
}

/** Format the active tab via formatService and sync store (fallback when Monaco format is unavailable). */
export async function formatActiveFileInStore(): Promise<boolean> {
  const state = useIDEStore.getState()
  if (!isEditorWritableForFormat(state)) return false

  const file = state.files[state.activeFile]
  if (!file || !canFormatFile(file)) return false

  const formatted = await formatFileContent(file.content, file.language)
  if (formatted === file.content) return false

  const activeIndex = state.activeFile
  state.setFiles((prev) => {
    const next = [...prev]
    next[activeIndex] = { ...file, content: formatted }
    return next
  })
  return true
}
