import { useCallback, useEffect, useRef, useState } from 'react'
import { WebContainer } from '@webcontainer/api'
import { createTranslator } from '../i18n'
import { registerTerminalBridge } from '../services/terminalBridge'
import { getWorkspaceLocale } from '../services/workspaceErrors'

let webcontainerInstance: WebContainer | null = null
let initPromise: Promise<WebContainer> | null = null

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
          const errorMessage = err instanceof Error ? err.message : t('runtime.webcontainer.bootFailed')
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

    try {
      const process = await instance.spawn(command, args)

      await process.output.pipeTo(new WritableStream({
        write(data) {
          if (mountedRef.current) {
            outputRef.current = [...outputRef.current, data]
            setOutput(outputRef.current)
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

  useEffect(() => {
    if (isReady) {
      registerTerminalBridge(runCommand, () => outputRef.current)
    } else {
      registerTerminalBridge(null)
    }
    return () => registerTerminalBridge(null)
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
    installDependencies,
    retry,
    fs: webcontainerInstance?.fs || null,
  }
}
