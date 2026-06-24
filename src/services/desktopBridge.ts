import { registerTerminalBridge } from './terminalBridge'
import { appendTerminalOutput, getTerminalOutputLines } from '../lib/terminalSession'

export function isDesktopApp(): boolean {
  if (typeof window === 'undefined') return false
  if (window.aiIdeDesktop?.isDesktop) return true
  // Offline Electron shell loads dist-electron-ui (vite --mode electron) even before preload bridges.
  return import.meta.env.MODE === 'electron'
}

export function getDesktopApi(): Window['aiIdeDesktop'] {
  return window.aiIdeDesktop
}

/** Wire native shell terminal (IDE-4b-2). */
export function initDesktopTerminalBridge(getProjectRoot: () => string | null): void {
  const api = getDesktopApi()
  if (!api) return

  registerTerminalBridge(
    async (command, args) => {
      const root = getProjectRoot()
      const line = [command, ...(args ?? [])].filter(Boolean).join(' ')
      appendTerminalOutput(`\r\n$ ${line}\r\n`)
      const result = await api.runCommand(root ?? '', line)
      if (result.output) appendTerminalOutput(`${result.output}\r\n`)
      return result.exitCode
    },
    getTerminalOutputLines,
  )
}

export async function getDesktopMaxImportFiles(): Promise<number> {
  const api = getDesktopApi()
  if (!api) return 500
  const info = await api.getInfo()
  return info.maxImportFiles
}
