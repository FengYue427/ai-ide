import { getStatus, stageAllUnstaged } from '../services/gitService'
import type { FileItem } from '../types/file'

export interface StageAllInWorkspaceInput {
  fs: any
  files: FileItem[]
  dir?: string
}

export interface StageAllInWorkspaceResult {
  stagedCount: number
  unstagedCount: number
}

/** Sync editor files to the runtime FS and stage all unstaged paths. */
export async function stageAllInWorkspace({
  fs,
  files,
  dir = '/',
}: StageAllInWorkspaceInput): Promise<StageAllInWorkspaceResult> {
  for (const file of files) {
    await fs.writeFile(file.name, file.content)
  }

  const status = await getStatus(fs, dir)
  const unstagedCount = status.filter((item) => !item.staged).length
  const stagedCount = await stageAllUnstaged(fs, dir, status)

  return { stagedCount, unstagedCount }
}
