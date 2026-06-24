import { useEffect } from 'react'
import { initDesktopTerminalBridge, isDesktopApp, waitForDesktopApi } from '../services/desktopBridge'
import {
  bindDesktopProjectResult,
  getElectronRootPath,
  localProjectService,
} from '../services/localProjectService'
import type { DesktopOpenResult } from '../types/ai-ide-desktop'

async function applyOpenResult(result: DesktopOpenResult) {
  bindDesktopProjectResult(result)
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

    let cancelled = false
    let unsubMenu: (() => void) | undefined

    void (async () => {
      const api = await waitForDesktopApi()
      if (cancelled || !api) return

      initDesktopTerminalBridge(() => getElectronRootPath())

      unsubMenu = api.onProjectOpened?.((result) => {
        void applyOpenResult(result)
      })

      if (localProjectService.isBound()) return
      try {
        const { restoreLocalProjectIntoWorkspace } = await import('../services/localProjectBridge')
        await restoreLocalProjectIntoWorkspace()
      } catch {
        /* user picks folder manually */
      }
    })()

    return () => {
      cancelled = true
      unsubMenu?.()
    }
  }, [])
}
