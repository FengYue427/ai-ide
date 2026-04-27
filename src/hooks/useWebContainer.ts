import { useState, useEffect, useCallback, useRef } from 'react'
import { WebContainer } from '@webcontainer/api'

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
        
        // 使用全局 Promise 避免重复初始化
        if (!initPromise) {
          initPromise = WebContainer.boot()
        }
        
        const instance = await initPromise
        
        // 只有组件仍然挂载时才更新状态
        if (mountedRef.current) {
          webcontainerInstance = instance
          setIsReady(true)
        }
      } catch (err) {
        if (mountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'WebContainer 启动失败'
          const initError = new Error(errorMessage)
          setError(initError)
          console.error('[useWebContainer] Initialization failed:', err)
          // 重置全局 Promise 以便下次重试
          initPromise = null
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
        }
      }
    }
    
    initWebContainer()
    
    // 清理函数
    return () => {
      mountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [retryCount])

  // 重试功能
  const retry = useCallback(() => {
    if (isLoading) return
    webcontainerInstance = null
    initPromise = null
    setRetryCount(c => c + 1)
  }, [isLoading])

  const writeFile = useCallback(async (path: string, content: string) => {
    if (!webcontainerInstance) {
      throw new Error('WebContainer 未就绪')
    }
    try {
      await webcontainerInstance.fs.writeFile(path, content)
    } catch (err) {
      console.error('[useWebContainer] Write file failed:', err)
      throw err
    }
  }, [])

  const mkdir = useCallback(async (path: string) => {
    if (!webcontainerInstance) {
      throw new Error('WebContainer 未就绪')
    }
    try {
      await webcontainerInstance.fs.mkdir(path, { recursive: true })
    } catch (err) {
      console.error('[useWebContainer] Mkdir failed:', err)
      throw err
    }
  }, [])

  const runCommand = useCallback(async (command: string, args: string[] = []) => {
    if (!webcontainerInstance) {
      throw new Error('WebContainer 未就绪')
    }
    if (isRunning) {
      throw new Error('已有命令正在运行')
    }

    setIsRunning(true)
    outputRef.current = []
    setOutput([])

    try {
      const process = await webcontainerInstance.spawn(command, args)

      await process.output.pipeTo(new WritableStream({
        write(data) {
          if (mountedRef.current) {
            outputRef.current = [...outputRef.current, data]
            setOutput(outputRef.current)
          }
        }
      }))

      const exitCode = await process.exit
      return exitCode
    } catch (err) {
      console.error('[useWebContainer] Command failed:', err)
      throw err
    } finally {
      if (mountedRef.current) {
        setIsRunning(false)
      }
    }
  }, [isRunning])

  const runNode = useCallback(async (fileName: string = 'index.js') => {
    return runCommand('node', [fileName])
  }, [runCommand])

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
    fs: webcontainerInstance?.fs || null
  }
}
