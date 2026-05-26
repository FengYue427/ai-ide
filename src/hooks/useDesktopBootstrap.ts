import { useEffect } from 'react'
import { initDesktopTerminalBridge, isDesktopApp } from '../services/desktopBridge'
import { getElectronRootPath, localProjectService } from '../services/localProjectService'
import type { DesktopOpenResult } from '../types/ai-ide-desktop'

async function applyOpenResult(result: DesktopOpenResult) {
  const { workspaceContextService } = await import('../services/workspaceContextService')
  await workspaceContextService.clearContext()
  await workspaceContextService.createFromFiles(
    result.entries.map((e) => ({
      name: e.path,
      content: e.content,
      language: e.language,
    })),
    result.rootName,
  )
}

/** IDE-4b: native terminal + restore folder + menu Open (Ctrl+O). */
export function useDesktopBootstrap() {
  useEffect(() => {
    if (!isDesktopApp()) return

    const api = window.aiIdeDesktop
    if (!api) return

    initDesktopTerminalBridge(() => getElectronRootPath())

    const unsubMenu = api.onProjectOpened?.((result) => {
      void applyOpenResult(result)
    })

    void (async () => {
      if (localProjectService.isBound()) return
      try {
        const { restoreLocalProjectIntoWorkspace } = await import('../services/localProjectBridge')
        await restoreLocalProjectIntoWorkspace()
      } catch {
        /* user picks folder manually */
      }
    })()

    return () => {
      unsubMenu?.()
    }
  }, [])
}
