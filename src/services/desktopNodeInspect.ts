import { appendTerminalOutput } from '../lib/terminalSession'
import type { DesktopSpawnNodeInspectResult } from '../types/ai-ide-desktop'
import { nodeInspectBrkArgs } from './debugAlphaService'
import type { NodeInspectSessionHandle } from './debugSessionService'
import { getDesktopApi } from './desktopBridge'
import { getElectronRootPath } from './localProjectService'

export async function spawnDesktopNodeInspectSession(
  entryFile: string,
): Promise<NodeInspectSessionHandle> {
  const api = getDesktopApi()
  const rootPath = getElectronRootPath()
  if (!api || !rootPath) {
    return { inspectUrl: null, kill: () => {}, done: Promise.resolve(undefined) }
  }

  const args = nodeInspectBrkArgs(entryFile)
  appendTerminalOutput(`\r\n\x1b[90m$ node ${args.join(' ')}\x1b[0m (desktop)\r\n`)

  const result: DesktopSpawnNodeInspectResult = await api.spawnNodeInspect({
    rootPath,
    entryFile,
  })

  if (!result.ok || !result.inspectUrl) {
    return { inspectUrl: null, kill: () => {}, done: Promise.resolve(undefined) }
  }

  const sessionId = result.sessionId
  const done = new Promise<number | undefined>((resolve) => {
    const unsub = api.onNodeInspectExit?.((payload) => {
      if (payload.sessionId !== sessionId) return
      unsub?.()
      resolve(payload.exitCode ?? undefined)
    })
  })

  return {
    inspectUrl: result.inspectUrl,
    kill: () => {
      void api.killNodeInspect(sessionId)
    },
    done,
  }
}
