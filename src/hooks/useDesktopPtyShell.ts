import { useEffect, useRef, useState } from 'react'
import { appendTerminalOutput, registerShellInputWriter, registerShellResizeHandler } from '../lib/terminalSession'
import { getDesktopApi, waitForDesktopApi } from '../services/desktopBridge'

type PtyCapabilities = {
  available: boolean
  reason?: string
}

export function useDesktopPtyShell(options: {
  enabled: boolean
  activeSessionId: string
  getProjectRoot: () => string | null
  cols: number
  rows: number
}) {
  const { enabled, activeSessionId, getProjectRoot, cols, rows } = options
  const [capabilities, setCapabilities] = useState<PtyCapabilities>({ available: false })
  const [desktopApiReady, setDesktopApiReady] = useState(false)
  const sessionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setDesktopApiReady(false)
      return
    }

    let cancelled = false
    void waitForDesktopApi().then((api) => {
      if (!cancelled) setDesktopApiReady(Boolean(api))
    })

    return () => {
      cancelled = true
    }
  }, [enabled])

  useEffect(() => {
    const api = getDesktopApi()
    if (!desktopApiReady || !api?.ptyCapabilities) {
      setCapabilities({
        available: false,
        reason: desktopApiReady ? 'Desktop PTY API missing' : 'Desktop preload not ready',
      })
      return
    }
    void api.ptyCapabilities().then(setCapabilities)
  }, [desktopApiReady])

  useEffect(() => {
    const api = getDesktopApi()
    if (!enabled || !desktopApiReady || !capabilities.available || !api?.ptySpawn) {
      registerShellInputWriter(null)
      registerShellResizeHandler(null)
      return
    }

    let cancelled = false
    const sessionId = activeSessionId

    const unsubscribe = api.onPtyData?.((payload) => {
      if (payload.sessionId !== sessionId || cancelled) return
      appendTerminalOutput(payload.data)
    })

    void api.ptySpawn({
      sessionId,
      cwd: getProjectRoot() ?? '',
      cols: Math.max(cols, 1),
      rows: Math.max(rows, 1),
    }).then((result) => {
      if (cancelled || !result.ok) {
        if (!result.ok && result.reason) {
          appendTerminalOutput(`\r\n[pty] ${result.reason}\r\n`)
        }
        return
      }
      sessionRef.current = sessionId
      registerShellInputWriter((data) => {
        void api.ptyWrite?.({ sessionId, data })
      })
      registerShellResizeHandler((c, r) => {
        void api.ptyResize?.({ sessionId, cols: c, rows: r })
      })
    })

    return () => {
      cancelled = true
      unsubscribe?.()
      registerShellInputWriter(null)
      registerShellResizeHandler(null)
      if (sessionRef.current === sessionId) {
        void api.ptyKill?.({ sessionId })
        sessionRef.current = null
      }
    }
  }, [activeSessionId, capabilities.available, cols, desktopApiReady, enabled, getProjectRoot, rows])

  return capabilities
}
