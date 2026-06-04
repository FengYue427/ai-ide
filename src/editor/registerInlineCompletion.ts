import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import type { AIConfig } from '../services/aiService'
import { isAiConfigured } from '../lib/aiPlatformMode'
import { inlineCompletionService } from '../services/inlineCompletionService'
import { useIDEStore } from '../store/ideStore'

export interface InlineCompletionOptions {
  language: string
  filename: string
  getConfig: () => AIConfig
  enabled?: () => boolean
}

function readContext(model: monaco.editor.ITextModel, position: monaco.Position) {
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
  return { prefix, suffix }
}

export function registerInlineCompletionProvider(options: InlineCompletionOptions): monaco.IDisposable {
  const { language, filename, getConfig, enabled } = options

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let requestSeq = 0

  const inlineProvider = monaco.languages.registerInlineCompletionsProvider(language, {
    provideInlineCompletions: (model, position, _context, token) => {
      if (enabled && !enabled()) {
        return { items: [] }
      }

      const config = getConfig()
      const loggedIn = Boolean(useIDEStore.getState().currentUser)
      if (!isAiConfigured(config, loggedIn)) {
        return { items: [] }
      }

      const seq = ++requestSeq

      return new Promise((resolve) => {
        if (debounceTimer) clearTimeout(debounceTimer)

        debounceTimer = setTimeout(() => {
          debounceTimer = null
          if (token.isCancellationRequested || seq !== requestSeq) {
            resolve({ items: [] })
            return
          }

          const { prefix, suffix } = readContext(model, position)

          void inlineCompletionService
            .fetchCompletion({
              prefix,
              suffix,
              language,
              filename,
              config,
              loggedIn,
            })
            .then((text) => {
              if (token.isCancellationRequested || seq !== requestSeq || !text) {
                resolve({ items: [] })
                return
              }

              resolve({
                items: [
                  {
                    insertText: text,
                    range: new monaco.Range(
                      position.lineNumber,
                      position.column,
                      position.lineNumber,
                      position.column,
                    ),
                  },
                ],
              })
            })
            .catch(() => resolve({ items: [] }))
        }, inlineCompletionService.debounceMs)
      })
    },
    freeInlineCompletions: () => {},
  })

  const suggestProvider = monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: ['.'],
    provideCompletionItems: async (model, position, context, token) => {
      if (context.triggerKind !== monaco.languages.CompletionTriggerKind.Invoke) {
        return { suggestions: [] }
      }
      if (enabled && !enabled()) return { suggestions: [] }

      const config = getConfig()
      const loggedIn = Boolean(useIDEStore.getState().currentUser)
      if (!isAiConfigured(config, loggedIn)) {
        return { suggestions: [] }
      }

      const { prefix, suffix } = readContext(model, position)
      const completion = await inlineCompletionService.fetchCompletion({
        prefix,
        suffix,
        language,
        filename,
        config,
        loggedIn,
      })

      if (token.isCancellationRequested || !completion) {
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
            label: 'AI Tab completion',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: completion,
            range,
            preselect: true,
            sortText: '0',
          },
        ],
      }
    },
  })

  return {
    dispose: () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      inlineProvider.dispose()
      suggestProvider.dispose()
    },
  }
}
