import { workspaceContextService } from './workspaceContextService'

const AIDE_PATH_RE = /^\.aide\//i

interface EditorFileLike {
  name: string
  content: string
  language: string
}

function detectLanguage(path: string): string {
  if (path.endsWith('.md')) return 'markdown'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.ts')) return 'typescript'
  if (path.endsWith('.tsx')) return 'typescript'
  if (path.endsWith('.js')) return 'javascript'
  return 'plaintext'
}

export function listAideEditorFiles(files: EditorFileLike[]): EditorFileLike[] {
  return files.filter((file) => AIDE_PATH_RE.test(file.name.replace(/\\/g, '/')))
}

export async function syncAideFilesToWorkspace(
  files: EditorFileLike[],
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const aideFiles = listAideEditorFiles(files)
  const result = { synced: 0, failed: 0, errors: [] as string[] }
  if (aideFiles.length === 0) return result

  if (!workspaceContextService.getContext()) {
    await workspaceContextService.createContext('.aide')
  }

  for (const file of aideFiles) {
    const path = file.name.replace(/\\/g, '/')
    try {
      await workspaceContextService.addFile({
        name: path.split('/').pop() || path,
        path,
        content: file.content,
        language: file.language || detectLanguage(path),
        selected: true,
      })
      result.synced += 1
    } catch (error) {
      result.failed += 1
      result.errors.push(`${path}: ${error instanceof Error ? error.message : 'sync failed'}`)
    }
  }
  return result
}
