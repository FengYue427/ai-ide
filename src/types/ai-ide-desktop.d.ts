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

export type DesktopPtyCapabilities = {
  available: boolean
  reason?: string
  platform?: string
}

export type DesktopPtySpawnResult = {
  ok: boolean
  shell?: string
  reason?: string
}

export type DesktopGitReadonlySnapshot =
  | {
      ok: true
      statusPorcelain: string
      branch: string
      branches: string[]
    }
  | {
      ok: false
      reason: string
      detail?: string
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
  readGitReadonlySnapshot: (rootPath: string) => Promise<DesktopGitReadonlySnapshot>
  runCommand: (rootPath: string, commandLine: string) => Promise<DesktopRunResult>
  ptyCapabilities: () => Promise<DesktopPtyCapabilities>
  ptySpawn: (payload: {
    sessionId: string
    cwd?: string
    cols?: number
    rows?: number
  }) => Promise<DesktopPtySpawnResult>
  ptyWrite: (payload: { sessionId: string; data: string }) => Promise<{ ok: boolean }>
  ptyResize: (payload: { sessionId: string; cols: number; rows: number }) => Promise<{ ok: boolean }>
  ptyKill: (payload: { sessionId: string }) => Promise<{ ok: boolean }>
  onPtyData: (callback: (payload: { sessionId: string; data: string }) => void) => () => void
  onPtyExit: (callback: (payload: { sessionId: string; exitCode: number }) => void) => () => void
  getInfo: () => Promise<{
    version: string
    platform: string
    maxImportFiles: number
    shellMode?: DesktopShellMode
    packaged?: boolean
    autoUpdate?: boolean
    ptyAvailable?: boolean
    ptyReason?: string
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
