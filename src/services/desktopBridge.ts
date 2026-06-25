import { registerTerminalBridge } from './terminalBridge'
import { appendTerminalOutput, getTerminalOutputLines } from '../lib/terminalSession'

/** Set at build time for `vite build --mode electron` offline shell. */
const IS_ELECTRON_SHELL = String(import.meta.env?.VITE_DESKTOP_SHELL ?? '') === 'true'

export function isElectronShellBuild(): boolean {
  return IS_ELECTRON_SHELL
}

export function isDesktopApp(): boolean {
  if (typeof window === 'undefined') return false
  if (window.aiIdeDesktop?.isDesktop) return true
  return IS_ELECTRON_SHELL
}

export function hasDesktopNativeApi(): boolean {
  return typeof window !== 'undefined' && typeof window.aiIdeDesktop?.pickProjectFolder === 'function'
}

export function getDesktopApi(): Window['aiIdeDesktop'] | undefined {
  return window.aiIdeDesktop
}

/** Wait for Electron preload to expose `window.aiIdeDesktop` (offline shell cold start). */
export async function waitForDesktopApi(timeoutMs = 8000): Promise<Window['aiIdeDesktop'] | undefined> {
  if (typeof window === 'undefined') return undefined
  const ready = () =>
    typeof window.aiIdeDesktop?.pickProjectFolder === 'function' ? window.aiIdeDesktop : undefined
  const existing = ready()
  if (existing) return existing

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50))
    const api = ready()
    if (api) return api
  }
  return undefined
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
