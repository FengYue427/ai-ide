import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import {
  findReferencesInFiles,
  type ReferenceLocation,
} from '../services/referenceIndexService'

export interface ReferenceProjectFile {
  name: string
  content: string
}

export function registerCrossFileReferenceProvider(
  files: ReferenceProjectFile[],
): monaco.IDisposable {
  const languages = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact', 'plaintext']

  return monaco.languages.registerReferenceProvider(languages, {
    provideReferences(model, position) {
      const word = model.getWordAtPosition(position)
      if (!word?.word) return []

      const refs = findReferencesInFiles(files, word.word)
      return refs.map((ref: ReferenceLocation) => ({
        uri: monaco.Uri.parse(`inmemory://${ref.path.replace(/\\/g, '/')}`),
        range: {
          startLineNumber: ref.line,
          startColumn: ref.column,
          endLineNumber: ref.line,
          endColumn: ref.column + word.word.length,
        },
      }))
    },
  })
}

export function resolveReferenceNavigation(
  files: ReferenceProjectFile[],
  targetPath: string,
): { fileIndex: number; line: number; column: number } | null {
  const normalized = targetPath.replace(/^inmemory:\/\//, '').replace(/^\//, '')
  const index = files.findIndex(
    (file) => file.name === normalized || file.name.endsWith(`/${normalized}`),
  )
  if (index < 0) return null
  return { fileIndex: index, line: 1, column: 1 }
}
