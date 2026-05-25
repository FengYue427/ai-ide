/**
 * Bind local disk folder → workspace context + editor tabs (IDE-4a-1).
 */
import { workspaceContextService } from './workspaceContextService'
import { localProjectService, type LocalProjectOpenResult } from './localProjectService'

export async function openLocalProjectIntoWorkspace(
  projectName?: string,
): Promise<LocalProjectOpenResult> {
  const result = await localProjectService.openProjectPicker()
  await applyScanToWorkspace(result, projectName ?? result.rootName)
  return result
}

/** Editor tab shape used by ideStore / WorkspaceManager. */
export function localProjectEntriesToEditorFiles(
  entries: LocalProjectOpenResult['entries'],
): { name: string; content: string; language: string }[] {
  return entries.map((e) => ({
    name: e.path,
    content: e.content,
    language: e.language,
  }))
}

export async function restoreLocalProjectIntoWorkspace(): Promise<LocalProjectOpenResult | null> {
  const result = await localProjectService.restorePersistedProject()
  if (!result) return null
  await applyScanToWorkspace(result, result.rootName)
  return result
}

async function applyScanToWorkspace(
  result: LocalProjectOpenResult,
  name: string,
): Promise<void> {
  await workspaceContextService.clearContext()
  await workspaceContextService.createFromFiles(
    result.entries.map((e) => ({
      name: e.path,
      content: e.content,
      language: e.language,
    })),
    name,
  )
}
