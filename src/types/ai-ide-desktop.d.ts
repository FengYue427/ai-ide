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
  getInfo: () => Promise<{ version: string; platform: string; maxImportFiles: number }>
  onProjectOpened: (callback: (result: DesktopOpenResult) => void) => () => void
}

declare global {
  interface Window {
    aiIdeDesktop?: AiIdeDesktopApi
  }
}

export {}
