import { useEffect } from 'react'
import { projectIndexManager } from '../services/projectIndexManager'
import { workspaceContextService } from '../services/workspaceContextService'
import { useIDEStore } from '../store/ideStore'

const DEBOUNCE_MS = 320

/** Keep project symbol index in sync with editor tabs + workspace (incremental when possible). */
export function useProjectIndexSync(): void {
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const syncNow = () => {
      const files = useIDEStore.getState().files
      projectIndexManager.syncFromWorkspace(
        files.map((file) => ({
          name: file.name,
          content: file.content,
          language: file.language,
        })),
      )
    }

    const scheduleSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        const files = useIDEStore.getState().files
        projectIndexManager.scheduleSyncFromWorkspace(
          files.map((file) => ({
            name: file.name,
            content: file.content,
            language: file.language,
          })),
        )
      }, DEBOUNCE_MS)
    }

    syncNow()

    const unsubWorkspace = workspaceContextService.onChange(syncNow)
    const unsubStore = useIDEStore.subscribe((state, prev) => {
      if (state.files !== prev.files) scheduleSync()
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      unsubWorkspace()
      unsubStore()
    }
  }, [])
}
