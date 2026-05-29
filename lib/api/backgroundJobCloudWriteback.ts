import type { BackgroundJobResultPayload } from './backgroundJobTypes'
import { ensureDefaultWorkspace, getWorkspaceByName, upsertWorkspace } from './workspacesService'

export type WorkspaceFileRecord = {
  name: string
  content: string
  language?: string
}

export type PendingFileChange = {
  path: string
  content: string
  language?: string
}

export type CloudWritebackResult = {
  applied: boolean
  workspace: string
  paths: string[]
  error?: string
}

function normalizeWorkspacePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').trim()
}

export function parseWorkspaceFilesJson(filesJson: string): WorkspaceFileRecord[] {
  try {
    const parsed = JSON.parse(filesJson) as unknown
    if (!Array.isArray(parsed)) return []
    const out: WorkspaceFileRecord[] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      const name = (item as { name?: unknown }).name
      const content = (item as { content?: unknown }).content
      if (typeof name !== 'string' || !name.trim()) continue
      if (typeof content !== 'string') continue
      out.push({
        name: normalizeWorkspacePath(name),
        content,
        language:
          typeof (item as { language?: unknown }).language === 'string'
            ? (item as { language: string }).language
            : undefined,
      })
    }
    return out
  } catch {
    return []
  }
}

export function mergePendingChangesIntoWorkspaceFiles(
  files: WorkspaceFileRecord[],
  changes: PendingFileChange[],
): WorkspaceFileRecord[] {
  const map = new Map<string, WorkspaceFileRecord>()
  for (const file of files) {
    map.set(normalizeWorkspacePath(file.name), file)
  }
  for (const change of changes) {
    const name = normalizeWorkspacePath(change.path)
    if (!name) continue
    map.set(name, {
      name,
      content: change.content,
      language: change.language ?? map.get(name)?.language ?? 'plaintext',
    })
  }
  return [...map.values()]
}

export async function applyBackgroundJobResultToCloudWorkspace(
  userId: string,
  repoKey: string | null | undefined,
  pendingChanges: PendingFileChange[],
): Promise<CloudWritebackResult> {
  const workspaceName = (repoKey?.trim() || 'default').slice(0, 256)
  if (pendingChanges.length === 0) {
    return { applied: false, workspace: workspaceName, paths: [] }
  }

  try {
    let workspace = await getWorkspaceByName(userId, workspaceName)
    if (!workspace && workspaceName === 'default') {
      workspace = await ensureDefaultWorkspace(userId)
    }
    if (!workspace) {
      return {
        applied: false,
        workspace: workspaceName,
        paths: [],
        error: 'WORKSPACE_NOT_FOUND',
      }
    }

    const files = parseWorkspaceFilesJson(workspace.files)
    const merged = mergePendingChangesIntoWorkspaceFiles(files, pendingChanges)
    const paths = pendingChanges.map((c) => normalizeWorkspacePath(c.path)).filter(Boolean)

    await upsertWorkspace(
      userId,
      workspaceName,
      JSON.stringify(merged),
      workspace.settings ?? '{}',
    )

    return { applied: true, workspace: workspaceName, paths }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { applied: false, workspace: workspaceName, paths: [], error: message }
  }
}

export async function enrichResultWithCloudWriteback(
  userId: string,
  repoKey: string | null | undefined,
  result: BackgroundJobResultPayload,
): Promise<BackgroundJobResultPayload> {
  const changes =
    result.pendingChanges?.filter(
      (c): c is PendingFileChange =>
        typeof c.path === 'string' && typeof (c as PendingFileChange).content === 'string',
    ) ?? []

  if (changes.length === 0) return result

  const writeback = await applyBackgroundJobResultToCloudWorkspace(userId, repoKey, changes)
  return {
    ...result,
    cloudWriteback: writeback,
    pendingChanges: changes.map((c) => ({ path: c.path, content: c.content, language: c.language })),
  }
}
