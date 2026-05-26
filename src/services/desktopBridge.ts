import { registerTerminalBridge } from './terminalBridge'

let terminalOutputLines: string[] = []

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.aiIdeDesktop?.isDesktop)
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
      const result = await api.runCommand(root ?? '', line)
      terminalOutputLines = result.output ? result.output.split(/\r?\n/) : []
      return result.exitCode
    },
    () => terminalOutputLines,
  )
}

export async function getDesktopMaxImportFiles(): Promise<number> {
  const api = getDesktopApi()
  if (!api) return 500
  const info = await api.getInfo()
  return info.maxImportFiles
}
