import { useCallback, useEffect, useRef, useState } from 'react'
import { WebContainer } from '@webcontainer/api'
import { createTranslator } from '../i18n'
import { registerTerminalBridge } from '../services/terminalBridge'
import { isDesktopApp } from '../services/desktopBridge'
import { appendTerminalOutput, getTerminalOutputLines } from '../lib/terminalSession'
import { nodeInspectBrkArgs, parseInspectUrlFromOutput } from '../services/debugAlphaService'

export interface NodeInspectSessionHandle {
  inspectUrl: string | null
  kill: () => void
  done: Promise<number | undefined>
}
import { getWorkspaceLocale } from '../services/workspaceErrors'

let webcontainerInstance: WebContainer | null = null
let initPromise: Promise<WebContainer> | null = null

export function getWebContainerInstance(): WebContainer | null {
  return webcontainerInstance
}

export interface UseWebContainerReturn {
  isReady: boolean
  isLoading: boolean
  error: Error | null
  output: string[]
  isRunning: boolean
  writeFile: (path: string, content: string) => Promise<void>
  mkdir: (path: string) => Promise<void>
  runCommand: (command: string, args?: string[]) => Promise<number | undefined>
  runNode: (fileName?: string) => Promise<number | undefined>
  runNodeInspect: (
    fileName?: string,
  ) => Promise<{ inspectUrl: string | null; exitCode: number | undefined }>
  spawnNodeInspectSession: (fileName?: string) => Promise<NodeInspectSessionHandle>
  installDependencies: () => Promise<number | undefined>
  retry: () => void
  fs: typeof WebContainer.prototype.fs | null
}

export function useWebContainer(): UseWebContainerReturn {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const outputRef = useRef<string[]>([])
  const mountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    mountedRef.current = true
    abortControllerRef.current = new AbortController()

    if (isDesktopApp()) {
      setIsLoading(false)
      setIsReady(false)
      setError(null)
      return () => {
        mountedRef.current = false
        abortControllerRef.current?.abort()
      }
    }

    async function initWebContainer() {
      if (!mountedRef.current) return

      try {
        setIsLoading(true)
        setError(null)

        if (!initPromise) {
          initPromise = WebContainer.boot()
        }

        const instance = await initPromise

        if (mountedRef.current) {
          webcontainerInstance = instance
          setIsReady(true)
        }
      } catch (err) {
        if (mountedRef.current) {
          const t = createTranslator(getWorkspaceLocale())
          let errorMessage = err instanceof Error ? err.message : t('runtime.webcontainer.bootFailed')
          if (typeof crossOriginIsolated !== 'undefined' && !crossOriginIsolated) {
            errorMessage = `${errorMessage}\n\n${t('runtime.webcontainer.crossOriginHint')}`
          }
          setError(new Error(errorMessage))
          console.error('[useWebContainer] Initialization failed:', err)
          initPromise = null
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    initWebContainer()

    return () => {
      mountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [retryCount])

  const retry = useCallback(() => {
    if (isLoading) return
    webcontainerInstance = null
    initPromise = null
    setIsReady(false)
    setRetryCount((count) => count + 1)
  }, [isLoading])

  const ensureReady = () => {
    if (!webcontainerInstance) {
      throw new Error(createTranslator(getWorkspaceLocale())('runtime.webcontainer.notReady'))
    }
    return webcontainerInstance
  }

  const writeFile = useCallback(async (path: string, content: string) => {
    const instance = ensureReady()
    try {
      await instance.fs.writeFile(path, content)
    } catch (err) {
      console.error('[useWebContainer] Write file failed:', err)
      throw err
    }
  }, [])

  const mkdir = useCallback(async (path: string) => {
    const instance = ensureReady()
    try {
      await instance.fs.mkdir(path, { recursive: true })
    } catch (err) {
      console.error('[useWebContainer] Mkdir failed:', err)
      throw err
    }
  }, [])

  const runCommand = useCallback(async (command: string, args: string[] = []) => {
    const instance = ensureReady()
    if (isRunning) {
      throw new Error(createTranslator(getWorkspaceLocale())('runtime.webcontainer.busy'))
    }

    setIsRunning(true)
    outputRef.current = []
    setOutput([])
    appendTerminalOutput(`\r\n\x1b[90m$ ${[command, ...args].join(' ')}\x1b[0m\r\n`)

    try {
      const process = await instance.spawn(command, args)

      await process.output.pipeTo(new WritableStream({
        write(data) {
          if (mountedRef.current) {
            outputRef.current = [...outputRef.current, data]
            setOutput(outputRef.current)
            appendTerminalOutput(data)
          }
        },
      }))

      return await process.exit
    } catch (err) {
      console.error('[useWebContainer] Command failed:', err)
      throw err
    } finally {
      if (mountedRef.current) {
        setIsRunning(false)
      }
    }
  }, [isRunning])

  const runNode = useCallback(async (fileName = 'index.js') => {
    return runCommand('node', [fileName])
  }, [runCommand])

  const spawnNodeInspectSession = useCallback(
    async (fileName = 'index.js'): Promise<NodeInspectSessionHandle> => {
      const instance = ensureReady()
      if (isRunning) {
        throw new Error(createTranslator(getWorkspaceLocale())('runtime.webcontainer.busy'))
      }

      setIsRunning(true)
      outputRef.current = []
      setOutput([])
      const args = nodeInspectBrkArgs(fileName)
      appendTerminalOutput(`\r\n\x1b[90m$ node ${args.join(' ')}\x1b[0m\r\n`)

      let inspectUrl: string | null = null
      let resolveInspectUrl: ((url: string | null) => void) | undefined
      const inspectUrlPromise = new Promise<string | null>((resolve) => {
        resolveInspectUrl = resolve
        window.setTimeout(() => resolve(null), 10_000)
      })

      try {
        const process = await instance.spawn('node', args)

        const done = (async () => {
          try {
            await process.output.pipeTo(
              new WritableStream({
                write(data) {
                  if (mountedRef.current) {
                    outputRef.current = [...outputRef.current, data]
                    setOutput(outputRef.current)
                    appendTerminalOutput(data)
                    if (!inspectUrl) {
                      const parsed = parseInspectUrlFromOutput(data)
                      if (parsed) {
                        inspectUrl = parsed
                        if (resolveInspectUrl) {
                          resolveInspectUrl(parsed)
                          resolveInspectUrl = undefined
                        }
                      }
                    }
                  }
                },
              }),
            )
            return await process.exit
          } finally {
            if (mountedRef.current) {
              setIsRunning(false)
            }
          }
        })()

        const resolvedUrl = await inspectUrlPromise
        if (!inspectUrl) {
          inspectUrl = resolvedUrl
        }

        return {
          inspectUrl,
          kill: () => process.kill(),
          done,
        }
      } catch (err) {
        console.error('[useWebContainer] Node inspect failed:', err)
        if (resolveInspectUrl) resolveInspectUrl(null)
        if (mountedRef.current) {
          setIsRunning(false)
        }
        throw err
      }
    },
    [isRunning],
  )

  const runNodeInspect = useCallback(
    async (fileName = 'index.js') => {
      const session = await spawnNodeInspectSession(fileName)
      const exitCode = await session.done
      return { inspectUrl: session.inspectUrl, exitCode }
    },
    [spawnNodeInspectSession],
  )

  useEffect(() => {
    if (isDesktopApp()) return
    if (isReady) {
      registerTerminalBridge(runCommand, getTerminalOutputLines)
    } else {
      registerTerminalBridge(null)
    }
    return () => {
      if (!isDesktopApp()) registerTerminalBridge(null)
    }
  }, [isReady, runCommand])

  const installDependencies = useCallback(async () => {
    return runCommand('npm', ['install'])
  }, [runCommand])

  return {
    isReady,
    isLoading,
    error,
    output,
    isRunning,
    writeFile,
    mkdir,
    runCommand,
    runNode,
    runNodeInspect,
    spawnNodeInspectSession,
    installDependencies,
    retry,
    fs: webcontainerInstance?.fs || null,
  }
}
