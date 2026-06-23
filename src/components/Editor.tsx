import React, { useEffect, useRef, useState } from 'react'
import MonacoEditor from '@monaco-editor/react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import {
  configureMonaco,
  resolveMonacoTheme,
  type AppEditorTheme,
  type MonacoEditorInstance,
  type MonacoMarker,
} from '../editor/monacoSetup'
import { Z } from '../lib/layers'
import { registerInlineCompletionProvider } from '../editor/registerInlineCompletion'
import { goToDefinition, goToReferences } from '../editor/languageServiceHostCore'
import { registerLanguageServiceProviders } from '../editor/languageServiceHost'
import { getMonacoTypeScriptDefinitions, getMonacoTypeScriptReferences } from '../editor/monacoTypeScriptNavigation'
import { monacoLocationToReference } from '../editor/referenceLocationMapping'
import { resolvePythonReferences } from '../editor/pythonImportNavigation'
import { resolveReferenceNavigation } from '../editor/registerCrossFileReferences'
import type { DefinitionProjectFile } from '../editor/registerCrossFileDefinition'
import { libUriStringToWorkspacePath, workspacePathToLibUriString } from '../editor/editorModelUri'
import { syncMonacoTypeScriptProject } from '../editor/syncTypeScriptProject'
import type { AIConfig } from '../services/aiService'
import { useI18n } from '../i18n'
import { useCollabEditorPresence } from '../hooks/useCollabEditorPresence'
import { canFormatFile, formatActiveFileInStore } from '../lib/editorFormat'
import { useIDEStore } from '../store/ideStore'
import { breakpointHasAdvancedOptions, breakpointsForFileDecorations } from '../lib/debugBreakpoints'
import { SkeletonLoader } from './SkeletonLoader'

interface EditorTarget {
  line: number
  column?: number
  nonce: number
}

interface EditorProps {
  value: string
  language: string
  filename?: string
  theme?: AppEditorTheme
  target?: EditorTarget | null
  aiConfig?: AIConfig
  inlineCompletionEnabled?: boolean
  readOnly?: boolean
  allFiles?: DefinitionProjectFile[]
  onChange: (value: string | undefined) => void
  onDiagnosticsChange?: (markers: MonacoMarker[]) => void
}

configureMonaco()

const Editor: React.FC<EditorProps> = ({
  value,
  language,
  filename = 'untitled',
  theme = 'vs-dark',
  target,
  aiConfig,
  inlineCompletionEnabled = true,
  readOnly = false,
  allFiles = [],
  onChange,
  onDiagnosticsChange,
}) => {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mountedEditor, setMountedEditor] = useState<MonacoEditorInstance | null>(null)
  const editorRef = useRef<MonacoEditorInstance | null>(null)
  const allFilesRef = useRef(allFiles)
  const aiConfigRef = useRef(aiConfig)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setEditorTarget = useIDEStore((s) => s.setEditorTarget)
  const debugBreakpoints = useIDEStore((s) => s.debugBreakpoints)
  const toggleDebugBreakpoint = useIDEStore((s) => s.toggleDebugBreakpoint)
  const setDebugBreakpointEnabled = useIDEStore((s) => s.setDebugBreakpointEnabled)
  const collaborationRoomId = useIDEStore((s) => s.collaborationRoomId)
  const formatDocumentNonce = useIDEStore((s) => s.formatDocumentNonce)
  const goToDefinitionNonce = useIDEStore((s) => s.goToDefinitionNonce)
  const goToReferencesNonce = useIDEStore((s) => s.goToReferencesNonce)
  const setReferencesPeek = useIDEStore((s) => s.setReferencesPeek)
  aiConfigRef.current = aiConfig
  allFilesRef.current = allFiles

  useCollabEditorPresence(
    mountedEditor,
    filename,
    Boolean(collaborationRoomId),
  )

  useEffect(() => {
    if (allFiles.length === 0) return

    const payload = allFiles.map((file) => ({
      name: file.name,
      content: file.content,
      language: file.language ?? 'javascript',
    }))

    const timer = window.setTimeout(() => {
      syncMonacoTypeScriptProject(payload, { activeFilename: filename })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [allFiles, filename])

  const handleDiagnostics = (markers: MonacoMarker[]) => {
    onDiagnosticsChange?.(markers)
  }

  useEffect(() => {
    if (!filename || allFiles.length === 0) return
    const disposable = registerLanguageServiceProviders(allFiles, filename)
    return () => disposable.dispose()
  }, [allFiles, filename])

  useEffect(() => {
    const disposable = monaco.editor.registerEditorOpener({
      openCodeEditor(_source, resource, selectionOrPosition) {
        const rawPath = libUriStringToWorkspacePath(resource.toString())
        const line =
          selectionOrPosition && 'startLineNumber' in selectionOrPosition
            ? selectionOrPosition.startLineNumber
            : 1
        const column =
          selectionOrPosition && 'startColumn' in selectionOrPosition
            ? selectionOrPosition.startColumn
            : 1
        const nav = resolveReferenceNavigation(allFilesRef.current, rawPath, line, column)
        if (!nav) return false

        setActiveFile(nav.fileIndex)
        setEditorTarget({ line: nav.line, column: nav.column, nonce: Date.now() })
        return true
      },
    })
    return () => disposable.dispose()
  }, [setActiveFile, setEditorTarget])

  useEffect(() => {
    if (!isLoading) return

    const timeoutId = window.setTimeout(() => {
      setLoadError(t('editor.loadTimeout'))
      setIsLoading(false)
    }, 12000)

    return () => window.clearTimeout(timeoutId)
  }, [isLoading, t])

  useEffect(() => {
    if (readOnly || !inlineCompletionEnabled || !aiConfig) return

    const disposable = registerInlineCompletionProvider({
      language,
      filename,
      getConfig: () => aiConfigRef.current ?? aiConfig,
      enabled: () => inlineCompletionEnabled && !!aiConfigRef.current,
      getSelection: () => {
        const editor = editorRef.current
        if (!editor) return null
        const selection = editor.getSelection()
        if (!selection) return null
        return {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        }
      },
    })

    return () => disposable.dispose()
  }, [language, filename, inlineCompletionEnabled, readOnly, aiConfig?.provider, aiConfig?.apiKey])

  useEffect(() => {
    if (!target || !editorRef.current) return

    const position = {
      lineNumber: Math.max(1, target.line),
      column: Math.max(1, target.column ?? 1),
    }

    editorRef.current.revealPositionInCenter(position)
    editorRef.current.setPosition(position)
    editorRef.current.focus()
  }, [target])

  useEffect(() => {
    if (!formatDocumentNonce || readOnly) return

    const runFormat = async () => {
      const editor = editorRef.current
      if (editor) {
        const action = editor.getAction('editor.action.formatDocument')
        if (action) {
          await action.run()
          return
        }
      }

      if (canFormatFile({ name: filename, language })) {
        await formatActiveFileInStore()
      }
    }

    void runFormat()
  }, [formatDocumentNonce, readOnly, filename, language])

  useEffect(() => {
    if (!goToDefinitionNonce || readOnly) return
    const editor = editorRef.current
    if (!editor) return
    const model = editor.getModel()
    const position = editor.getPosition()

    void (async () => {
      if (model && position) {
        const word = model.getWordAtPosition(position)
        if (word?.word) {
          const tsDefs = await getMonacoTypeScriptDefinitions(model, position, filename)
          if (tsDefs?.length) {
            const loc = tsDefs[0]
            const path = libUriStringToWorkspacePath(loc.uri.toString())
            const nav = resolveReferenceNavigation(
              allFilesRef.current,
              path,
              loc.range.startLineNumber,
              loc.range.startColumn,
            )
            if (nav) {
              setActiveFile(nav.fileIndex)
              setEditorTarget({ line: nav.line, column: nav.column, nonce: Date.now() })
              return
            }
          }

          const fallback = goToDefinition({
            file: filename,
            line: position.lineNumber,
            symbol: word.word,
            files: allFilesRef.current,
          })
          if (fallback) {
            const nav = resolveReferenceNavigation(
              allFilesRef.current,
              fallback.path,
              fallback.line,
              fallback.column ?? 1,
            )
            if (nav) {
              setActiveFile(nav.fileIndex)
              setEditorTarget({ line: nav.line, column: nav.column, nonce: Date.now() })
              return
            }
          }
        }
      }

      const action =
        editor.getAction('editor.action.goToDefinition') ??
        editor.getAction('editor.action.revealDefinition')
      void action?.run()
    })()
  }, [goToDefinitionNonce, readOnly, filename, setActiveFile, setEditorTarget])

  useEffect(() => {
    if (!goToReferencesNonce || readOnly) return
    const editor = editorRef.current
    if (!editor) return
    const model = editor.getModel()
    const position = editor.getPosition()

    void (async () => {
      if (model && position) {
        const word = model.getWordAtPosition(position)
        if (word?.word) {
          const isPython = model.getLanguageId() === 'python'
          const tsRefs = isPython
            ? null
            : await getMonacoTypeScriptReferences(model, position, filename)
          const refs = tsRefs?.length
            ? tsRefs.map(monacoLocationToReference)
            : isPython
              ? resolvePythonReferences({
                  currentFile: filename,
                  lineContent: model.getLineContent(position.lineNumber),
                  column: position.column,
                  symbol: word.word,
                  files: allFilesRef.current,
                })
              : goToReferences({ symbol: word.word, files: allFilesRef.current })
          if (refs.length > 0) {
            setReferencesPeek({
              symbol: word.word,
              locations: refs.map((ref) => ({
                path: ref.path,
                line: ref.line,
                column: ref.column,
              })),
            })
          } else {
            setReferencesPeek(null)
          }
        }
      }
      const action = editor.getAction('editor.action.goToReferences')
      void action?.run()
    })()
  }, [goToReferencesNonce, readOnly, setReferencesPeek, filename])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const fileBreakpoints = breakpointsForFileDecorations(debugBreakpoints, filename)
    const decorations = fileBreakpoints.map((bp) => ({
      range: new monaco.Range(bp.line, 1, bp.line, 1),
      options: {
        isWholeLine: true,
        glyphMarginClassName: [
          'debug-breakpoint-glyph',
          !bp.enabled ? 'debug-breakpoint-glyph--disabled' : '',
          bp.enabled && breakpointHasAdvancedOptions(bp) ? 'debug-breakpoint-glyph--conditional' : '',
        ]
          .filter(Boolean)
          .join(' '),
        glyphMarginHoverMessage: {
          value: bp.enabled
            ? breakpointHasAdvancedOptions(bp)
              ? t('debug.breakpointConditionalHover', {
                  line: bp.line,
                  condition: bp.condition?.trim() || '—',
                  hitCount: bp.hitCount != null && bp.hitCount >= 2 ? String(bp.hitCount) : '1',
                })
              : t('debug.breakpointHover', { line: bp.line })
            : t('debug.breakpointDisabledHover', { line: bp.line }),
        },
      },
    }))

    const collection = editor.createDecorationsCollection(decorations)
    return () => collection.clear()
  }, [debugBreakpoints, filename, mountedEditor, t])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || readOnly) return

    const subscription = editor.onMouseDown((event) => {
      if (event.target.type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) return
      const line = event.target.position?.lineNumber
      if (!line) return

      const key = `${filename}:${line}`
      const existing = useIDEStore.getState().debugBreakpoints.find((bp) => bp.id === key)
      if (event.event.altKey && existing) {
        setDebugBreakpointEnabled(filename, line, !existing.enabled)
        return
      }

      toggleDebugBreakpoint(filename, line)
    })

    return () => subscription.dispose()
  }, [filename, mountedEditor, readOnly, setDebugBreakpointEnabled, toggleDebugBreakpoint])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: Z.sticky }}>
          <SkeletonLoader theme={theme === 'vs-dark' ? 'dark' : 'light'} />
        </div>
      )}

      {loadError && (
        <div className="editor-load-error">
          <strong>{t('editor.loadFailed')}</strong>
          <span>{loadError}</span>
          <button
            onClick={() => {
              setLoadError(null)
              setIsLoading(true)
              window.location.reload()
            }}
          >
            {t('editor.reload')}
          </button>
        </div>
      )}

      <MonacoEditor
        height="100%"
        language={language}
        path={workspacePathToLibUriString(filename)}
        value={value}
        onChange={onChange}
        theme={resolveMonacoTheme(theme)}
        loading={null}
        onMount={(editor) => {
          editorRef.current = editor
          setMountedEditor(editor)
          setIsLoading(false)
          setLoadError(null)
          if (
            typeof localStorage !== 'undefined' &&
            localStorage.getItem('ai-ide:e2e-harness') === '1'
          ) {
            const harnessWindow = window as Window & {
              __AI_IDE_MONACO__?: typeof monaco
              __AI_IDE_STORE__?: typeof useIDEStore
            }
            harnessWindow.__AI_IDE_MONACO__ = monaco
            harnessWindow.__AI_IDE_STORE__ = useIDEStore
          }
        }}
        onValidate={handleDiagnostics}
        options={{
          readOnly,
          domReadOnly: readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
          lineNumbers: 'on',
          glyphMargin: !readOnly,
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
          folding: true,
          renderLineHighlight: 'line',
          matchBrackets: 'always',
          hover: { enabled: true, delay: 300 },
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
        }}
      />
    </div>
  )
}

export default Editor
