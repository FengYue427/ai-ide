import { useEffect, useRef } from 'react'
import { appendTerminalOutput, registerShellInputWriter, registerShellResizeHandler } from '../lib/terminalSession'
import { isDesktopApp } from '../services/desktopBridge'
import { getWebContainerInstance } from './useWebContainer'
import { useIDEStore } from '../store/ideStore'

interface UseWebContainerShellOptions {
  enabled: boolean
  isReady: boolean
  activeSessionId: string
  writeFile: (path: string, content: string) => Promise<void>
}

/** Interactive jsh shell via WebContainer ↔ xterm (browser only). One shell per active session. */
export function useWebContainerShell({
  enabled,
  isReady,
  activeSessionId,
  writeFile,
}: UseWebContainerShellOptions) {
  const processRef = useRef<{ kill: () => void } | null>(null)
  const writerRef = useRef<{ write: (chunk: string) => void; close: () => void } | null>(null)

  useEffect(() => {
    if (!enabled || !isReady || isDesktopApp()) {
      registerShellInputWriter(null)
      registerShellResizeHandler(null)
      return
    }

    let cancelled = false

    async function startShell() {
      const instance = getWebContainerInstance()
      if (!instance || cancelled) return

      try {
        const files = useIDEStore.getState().files
        for (const file of files) {
          await writeFile(file.name, file.content)
        }
      } catch (error) {
        console.error('[useWebContainerShell] sync files failed:', error)
      }

      if (cancelled) return

      try {
        const shell = await instance.spawn('jsh', [], {
          terminal: { cols: 80, rows: 24 },
        })
        if (cancelled) {
          shell.kill()
          return
        }

        processRef.current = shell
        const inputWriter = shell.input.getWriter()
        writerRef.current = inputWriter

        registerShellInputWriter((data) => {
          void inputWriter.write(data).catch(() => {})
        })

        registerShellResizeHandler((cols, rows) => {
          try {
            shell.resize({ cols, rows })
          } catch {
            /* process exited */
          }
        })

        void shell.output.pipeTo(
          new WritableStream<string>({
            write(data) {
              if (!cancelled) appendTerminalOutput(data)
            },
          }),
        )
      } catch (error) {
        console.error('[useWebContainerShell] spawn jsh failed:', error)
        appendTerminalOutput(`\r\n[shell] ${error instanceof Error ? error.message : String(error)}\r\n`)
      }
    }

    void startShell()

    return () => {
      cancelled = true
      registerShellInputWriter(null)
      registerShellResizeHandler(null)
      writerRef.current?.close?.()
      writerRef.current = null
      processRef.current?.kill()
      processRef.current = null
    }
  }, [activeSessionId, enabled, isReady, writeFile])
}
