import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { extractSymbolsFromContent } from '../services/projectIndexService'

export interface DefinitionProjectFile {
  name: string
  content: string
  language?: string
}

function findDefinition(
  files: DefinitionProjectFile[],
  symbolName: string,
  currentFile: string,
  currentLine: number,
): { path: string; line: number } | null {
  for (const file of files) {
    const symbols = extractSymbolsFromContent(file.name, file.content)
    const match = symbols.find((symbol) => symbol.name === symbolName)
    if (!match) continue
    if (file.name === currentFile && match.line === currentLine) continue
    return { path: file.name, line: match.line }
  }
  return null
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

      const location = findDefinition(files, word.word, currentFile, position.lineNumber)
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
