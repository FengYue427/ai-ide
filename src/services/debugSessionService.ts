import type { DebugCdpClient } from './debugCdpClient'
import { tryOpenDebuggerSession } from './debugCdpClient'
import { buildDebugPauseInspection } from './debugInspectService'
import { applyBreakpointInjectionToFile } from '../lib/debugBreakpointInjection'
import type { DebugBreakpoint } from '../lib/debugBreakpoints'
import type { DebugPauseInspection, DebugStackFrame } from '../types/debugInspect'
import type { FileItem } from '../types/file'

export interface NodeInspectSessionHandle {
  inspectUrl: string | null
  kill: () => void
  done: Promise<number | undefined>
}

export type DebugSyncMode = 'cdp' | 'injected'

let activeClient: DebugCdpClient | null = null
let activeKill: (() => void) | null = null
let cachedCallStack: DebugStackFrame[] = []

export function stopActiveDebugSession(): void {
  activeClient?.close()
  activeClient = null
  activeKill?.()
  activeKill = null
  cachedCallStack = []
}

export function getActiveDebugClient(): DebugCdpClient | null {
  return activeClient
}

export function getCachedDebugCallStack(): DebugStackFrame[] {
  return cachedCallStack
}

export function clearCachedDebugCallStack(): void {
  cachedCallStack = []
}

export interface StartDebugSessionInput {
  files: FileItem[]
  entryFile: string
  breakpoints: DebugBreakpoint[]
  writeFile: (path: string, content: string) => Promise<void>
  spawnInspect: (fileName: string) => Promise<NodeInspectSessionHandle>
  onPaused: (inspection: DebugPauseInspection) => void
  onResumed: () => void
  onEnded: () => void
}

export interface StartDebugSessionResult {
  inspectUrl: string | null
  syncMode: DebugSyncMode | null
  registeredBreakpointCount: number
}

export async function startDebugSessionWithBreakpoints(
  input: StartDebugSessionInput,
): Promise<StartDebugSessionResult> {
  stopActiveDebugSession()

  for (const file of input.files) {
    await input.writeFile(file.name, file.content)
  }

  const enabledBreakpoints = input.breakpoints.filter((bp) => bp.enabled)
  let session = await input.spawnInspect(input.entryFile)

  if (!session.inspectUrl) {
    return { inspectUrl: null, syncMode: null, registeredBreakpointCount: 0 }
  }

  const opened = await tryOpenDebuggerSession(session.inspectUrl, enabledBreakpoints)
  if (opened) {
    activeClient = opened.client
    activeKill = session.kill

    opened.client.onNotification((method, params) => {
      if (method === 'Debugger.paused') {
        void buildDebugPauseInspection(opened.client, params).then((inspection) => {
          if (!inspection) return
          cachedCallStack = inspection.callStack
          input.onPaused(inspection)
        })
      }
      if (method === 'Debugger.resumed') {
        cachedCallStack = []
        input.onResumed()
      }
    })

    void session.done.finally(() => {
      stopActiveDebugSession()
      input.onEnded()
    })

    return {
      inspectUrl: session.inspectUrl,
      syncMode: 'cdp',
      registeredBreakpointCount: opened.registered,
    }
  }

  session.kill()
  await new Promise((resolve) => window.setTimeout(resolve, 120))

  for (const file of input.files) {
    const fileBreakpoints = enabledBreakpoints.filter((bp) => bp.path === file.name)
    const content =
      fileBreakpoints.length > 0
        ? applyBreakpointInjectionToFile(file.content, fileBreakpoints)
        : file.content
    await input.writeFile(file.name, content)
  }

  session = await input.spawnInspect(input.entryFile)
  activeKill = session.kill

  void session.done.finally(() => {
    stopActiveDebugSession()
    input.onEnded()
  })

  return {
    inspectUrl: session.inspectUrl,
    syncMode: session.inspectUrl ? 'injected' : null,
    registeredBreakpointCount: enabledBreakpoints.length,
  }
}
