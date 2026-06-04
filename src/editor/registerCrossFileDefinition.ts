import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { goToDefinition } from './languageServiceHostCore'

export interface DefinitionProjectFile {
  name: string
  content: string
  language?: string
}

function toUri(path: string): monaco.Uri {
  return monaco.Uri.parse(`inmemory://${path.replace(/\\/g, '/')}`)
}

export function registerCrossFileDefinitionProvider(
  files: DefinitionProjectFile[],
  currentFile: string,
): monaco.IDisposable {
  const languages = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact']

  return monaco.languages.registerDefinitionProvider(languages, {
    provideDefinition(model, position) {
      const word = model.getWordAtPosition(position)
      if (!word?.word) return null

      const location = goToDefinition({
        file: currentFile,
        line: position.lineNumber,
        symbol: word.word,
        files,
      })
      if (!location) return null

      return {
        uri: toUri(location.path),
        range: {
          startLineNumber: location.line,
          startColumn: 1,
          endLineNumber: location.line,
          endColumn: 1,
        },
      }
    },
  })
}

/** Open another in-memory file at line (editor tabs). */
export function resolveDefinitionNavigation(
  files: DefinitionProjectFile[],
  targetPath: string,
): { fileIndex: number; line: number } | null {
  const index = files.findIndex(
    (file) => file.name === targetPath || file.name.endsWith(`/${targetPath}`),
  )
  if (index < 0) return null
  return { fileIndex: index, line: 1 }
}
