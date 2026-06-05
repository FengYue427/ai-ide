import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import type { AIConfig } from '../services/aiService'
import { buildFimContextFromSelection, type FimEditorSelection } from '../lib/fimMiddleSegment'
import { buildGhostInlineRange } from '../lib/ghostLayoutEngine'
import { isAiConfigured } from '../lib/aiPlatformMode'
import { inlineCompletionService } from '../services/inlineCompletionService'
import { isTabPlusPlusPocEnabled } from '../lib/tabPlusPlusPoc'
import { useIDEStore } from '../store/ideStore'

function toInlineCompletionItem(
  text: string,
  model: monaco.editor.ITextModel,
  position: monaco.Position,
): { insertText: string; range: monaco.Range } {
  if (!isTabPlusPlusPocEnabled()) {
    return {
      insertText: text,
      range: new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column,
      ),
    }
  }

  const layout = buildGhostInlineRange({
    insertText: text,
    lineNumber: position.lineNumber,
    column: position.column,
    lineContent: model.getLineContent(position.lineNumber),
  })

  return {
    insertText: layout.insertText,
    range: new monaco.Range(
      layout.startLineNumber,
      layout.startColumn,
      layout.endLineNumber,
      layout.endColumn,
    ),
  }
}

export interface InlineCompletionOptions {
  language: string
  filename: string
  getConfig: () => AIConfig
  enabled?: () => boolean
  getSelection?: () => FimEditorSelection | null
}

function readContext(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  getSelection?: () => FimEditorSelection | null,
) {
  const parts = buildFimContextFromSelection(
    model.getValue(),
    getSelection?.() ?? null,
    { lineNumber: position.lineNumber, column: position.column },
  )
  return parts
}

export function registerInlineCompletionProvider(options: InlineCompletionOptions): monaco.IDisposable {
  const { language, filename, getConfig, enabled, getSelection } = options

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

          const { prefix, suffix, middle } = readContext(model, position, getSelection)

          void inlineCompletionService
            .fetchCompletion({
              prefix,
              suffix,
              middle,
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

              const item = toInlineCompletionItem(text, model, position)
              resolve({
                items: [item],
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

      const { prefix, suffix, middle } = readContext(model, position, getSelection)
      const completion = await inlineCompletionService.fetchCompletion({
        prefix,
        suffix,
        middle,
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
