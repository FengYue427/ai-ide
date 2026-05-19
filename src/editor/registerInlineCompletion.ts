import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import type { AIConfig } from '../services/aiService'
import { inlineCompletionService } from '../services/inlineCompletionService'

export interface InlineCompletionOptions {
  language: string
  filename: string
  getConfig: () => AIConfig
  enabled?: () => boolean
}

let requestSeq = 0

export function registerInlineCompletionProvider(
  options: InlineCompletionOptions,
): monaco.IDisposable {
  const { language, filename, getConfig, enabled } = options

  return monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: ['.', '(', '[', '{', ' ', ':', '='],
    provideCompletionItems: async (model, position, _context, token) => {
      if (enabled && !enabled()) return { suggestions: [] }

      const config = getConfig()
      if (!config.apiKey?.trim() && config.provider !== 'ollama') {
        return { suggestions: [] }
      }

      const prefix = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      })
      const suffix = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: model.getLineCount(),
        endColumn: model.getLineMaxColumn(model.getLineCount()),
      })

      const seq = ++requestSeq
      const completion = await inlineCompletionService.fetchCompletion({
        prefix,
        suffix,
        language,
        filename,
        config,
      })

      if (token.isCancellationRequested || seq !== requestSeq || !completion) {
        return { suggestions: [] }
      }

      const range = new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column,
      )

      return {
        suggestions: [
          {
            label: 'AI 补全',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: completion,
            range,
            detail: 'AI IDE · Ctrl+Space',
            sortText: '0',
          },
        ],
      }
    },
  })
}
