import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { selectMonacoTypeScriptLibs } from './selectMonacoTypeScriptLibs'

export interface ProjectFileSource {
  name: string
  content: string
  language: string
}

function isScriptFile(file: ProjectFileSource): boolean {
  if (['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(file.language)) {
    return true
  }
  return /\.(tsx?|jsx?)$/i.test(file.name)
}

function toLibPath(name: string): string {
  return `file:///${name.replace(/\\/g, '/').replace(/^\//, '')}`
}

export type SyncMonacoTypeScriptOptions = {
  activeFilename?: string
}

/** Sync in-memory editor files into Monaco TS/JS language service for cross-file IntelliSense & F12. */
export function syncMonacoTypeScriptProject(
  files: ProjectFileSource[],
  options?: SyncMonacoTypeScriptOptions,
): void {
  const selected = selectMonacoTypeScriptLibs(files, options?.activeFilename)
  const libs = selected
    .filter(isScriptFile)
    .map((file) => ({
      content: file.content,
      filePath: toLibPath(file.name),
    }))

  const compilerOptions: monaco.languages.typescript.CompilerOptions = {
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    jsx: monaco.languages.typescript.JsxEmit.React,
    allowJs: true,
    checkJs: false,
  }

  for (const defaults of [
    monaco.languages.typescript.typescriptDefaults,
    monaco.languages.typescript.javascriptDefaults,
  ]) {
    defaults.setCompilerOptions(compilerOptions)
    defaults.setExtraLibs(libs)
  }
}
