import { useState, useEffect, useCallback, useRef } from 'react'
import { WebContainer } from '@webcontainer/api'

let webcontainerInstance: WebContainer | null = null

export function useWebContainer() {
  const [isReady, setIsReady] = useState(false)
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const outputRef = useRef<string[]>([])

  useEffect(() => {
    async function initWebContainer() {
      if (!webcontainerInstance) {
        webcontainerInstance = await WebContainer.boot()
      }
      setIsReady(true)
    }
    initWebContainer()
  }, [])

  const writeFile = useCallback(async (path: string, content: string) => {
    if (!webcontainerInstance) return
    await webcontainerInstance.fs.writeFile(path, content)
  }, [])

  const mkdir = useCallback(async (path: string) => {
    if (!webcontainerInstance) return
    await webcontainerInstance.fs.mkdir(path, { recursive: true })
  }, [])

  const runCommand = useCallback(async (command: string, args: string[] = []) => {
    if (!webcontainerInstance || isRunning) return

    setIsRunning(true)
    outputRef.current = []
    setOutput([])

    const process = await webcontainerInstance.spawn(command, args)

    process.output.pipeTo(new WritableStream({
      write(data) {
        outputRef.current = [...outputRef.current, data]
        setOutput(outputRef.current)
      }
    }))

    const exitCode = await process.exit
    setIsRunning(false)
    return exitCode
  }, [isRunning])

  const runNode = useCallback(async (fileName: string = 'index.js') => {
    return runCommand('node', [fileName])
  }, [runCommand])

  const installDependencies = useCallback(async () => {
    return runCommand('npm', ['install'])
  }, [runCommand])

  return {
    isReady,
    output,
    isRunning,
    writeFile,
    mkdir,
    runCommand,
    runNode,
    installDependencies,
    fs: webcontainerInstance?.fs || null
  }
}
