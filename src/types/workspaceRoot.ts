import type { FileItem } from './file'

/** One logical workspace root (v1.2 multi-root). */
export interface WorkspaceRoot {
  id: string
  name: string
  files: FileItem[]
  autosaveKey: string
}

export interface WorkspaceRootsMeta {
  activeRootId: string
  roots: Array<Pick<WorkspaceRoot, 'id' | 'name' | 'autosaveKey'>>
}
