import { useEffect } from 'react'
import { projectIndexManager } from '../services/projectIndexManager'
import { workspaceContextService } from '../services/workspaceContextService'
import { useIDEStore } from '../store/ideStore'

const DEBOUNCE_MS = 280

/** Keep project symbol index in sync with editor tabs + workspace context. */
export function useProjectIndexSync(): void {
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const rebuildNow = () => {
      const files = useIDEStore.getState().files
      projectIndexManager.rebuildFromWorkspace(
        files.map((file) => ({
          name: file.name,
          content: file.content,
          language: file.language,
        })),
      )
    }

    const scheduleRebuild = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        rebuildNow()
      }, DEBOUNCE_MS)
    }

    rebuildNow()

    const unsubWorkspace = workspaceContextService.onChange(rebuildNow)
    const unsubStore = useIDEStore.subscribe((state, prev) => {
      if (state.files !== prev.files) scheduleRebuild()
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      unsubWorkspace()
      unsubStore()
    }
  }, [])
}
