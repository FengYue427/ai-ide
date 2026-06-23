import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { getMonacoTypeScriptHover } from './monacoTypeScriptNavigation'

export function registerCrossFileHoverProvider(currentFile: string): monaco.IDisposable {
  const languages = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'] as const

  return monaco.languages.registerHoverProvider([...languages], {
    provideHover(model, position) {
      return getMonacoTypeScriptHover(model, position, currentFile)
    },
  })
}
