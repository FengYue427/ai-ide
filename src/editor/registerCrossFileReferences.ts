import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { isPythonNavigationEnabled } from '../lib/v13Features'
import { goToReferences } from './languageServiceHostCore'
import { getMonacoTypeScriptReferences } from './monacoTypeScriptNavigation'
import type { ReferenceLocation } from '../services/referenceIndexService'

export interface ReferenceProjectFile {
  name: string
  content: string
}

export function registerCrossFileReferenceProvider(
  files: ReferenceProjectFile[],
  currentFile: string,
): monaco.IDisposable {
  const languages = [
    'typescript',
    'javascript',
    'typescriptreact',
    'javascriptreact',
    'plaintext',
    ...(isPythonNavigationEnabled() ? (['python'] as const) : []),
  ]

  return monaco.languages.registerReferenceProvider(languages, {
    async provideReferences(model, position) {
      if (model.getLanguageId() !== 'python') {
        const tsRefs = await getMonacoTypeScriptReferences(model, position, currentFile)
        if (tsRefs?.length) return tsRefs
      }

      const word = model.getWordAtPosition(position)
      if (!word?.word) return []

      const refs = goToReferences({ symbol: word.word, files })
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
  line = 1,
  column = 1,
): { fileIndex: number; line: number; column: number } | null {
  const normalized = targetPath.replace(/^inmemory:\/\//, '').replace(/^\//, '')
  const index = files.findIndex(
    (file) => file.name === normalized || file.name.endsWith(`/${normalized}`),
  )
  if (index < 0) return null
  return { fileIndex: index, line: Math.max(1, line), column: Math.max(1, column) }
}
