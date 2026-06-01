import { useEffect } from 'react'
import { isMultiRootWorkspaceEnabled } from '../lib/v12Features'
import { toWorkspaceRootsMeta } from '../lib/workspaceRoots'
import { saveWorkspaceRootsMeta } from '../services/workspaceRootsService'
import { useIDEStore } from '../store/ideStore'

/** Persist multi-root metadata when roots or active id change. */
export function useWorkspaceRootsMeta(): void {
  const workspaceRoots = useIDEStore((s) => s.workspaceRoots)
  const activeRootId = useIDEStore((s) => s.activeRootId)

  useEffect(() => {
    if (!isMultiRootWorkspaceEnabled()) return
    void saveWorkspaceRootsMeta(toWorkspaceRootsMeta(workspaceRoots, activeRootId))
  }, [workspaceRoots, activeRootId])
}
