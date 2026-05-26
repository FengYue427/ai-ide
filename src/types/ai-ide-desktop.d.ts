export type DesktopProjectEntry = {
  path: string
  content: string
  language: string
  size: number
}

export type DesktopOpenResult = {
  rootPath: string
  rootName: string
  imported: number
  skipped: number
  capped: boolean
  errors: string[]
  entries: DesktopProjectEntry[]
}

export type DesktopRunResult = {
  exitCode: number
  output: string
}

export type DesktopShellMode = 'remote' | 'local-dev' | 'local-dist'

export type DesktopUpdatePhase =
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export type DesktopUpdateStatus = {
  phase: DesktopUpdatePhase
  version?: string
  message?: string
  percent?: number
  transferred?: number
  total?: number
}

export interface AiIdeDesktopApi {
  isDesktop: true
  shellMode: () => Promise<{ mode: DesktopShellMode; appUrl?: string }>
  pickProjectFolder: () => Promise<DesktopOpenResult | null>
  restoreLastProject: () => Promise<DesktopOpenResult | null>
  scanProject: (rootPath: string) => Promise<DesktopOpenResult>
  readFile: (
    rootPath: string,
    relPath: string,
    startLine?: number,
    endLine?: number,
  ) => Promise<string>
  writeFile: (rootPath: string, relPath: string, content: string) => Promise<{ ok: boolean }>
  runCommand: (rootPath: string, commandLine: string) => Promise<DesktopRunResult>
  getInfo: () => Promise<{
    version: string
    platform: string
    maxImportFiles: number
    shellMode?: DesktopShellMode
    packaged?: boolean
    autoUpdate?: boolean
  }>
  checkForUpdates: () => Promise<{ ok: boolean; reason?: string; error?: string }>
  onUpdateStatus: (callback: (status: DesktopUpdateStatus) => void) => () => void
  onProjectOpened: (callback: (result: DesktopOpenResult) => void) => () => void
}

declare global {
  interface Window {
    aiIdeDesktop?: AiIdeDesktopApi
  }
}

export {}
