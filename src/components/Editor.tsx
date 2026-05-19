import React, { useEffect, useRef, useState } from 'react'
import MonacoEditor from '@monaco-editor/react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { configureMonaco, type MonacoEditorInstance, type MonacoMarker } from '../editor/monacoSetup'
import { registerInlineCompletionProvider } from '../editor/registerInlineCompletion'
import {
  registerCrossFileDefinitionProvider,
  resolveDefinitionNavigation,
  type DefinitionProjectFile,
} from '../editor/registerCrossFileDefinition'
import { registerCrossFileReferenceProvider } from '../editor/registerCrossFileReferences'
import { syncMonacoTypeScriptProject } from '../editor/syncTypeScriptProject'
import type { AIConfig } from '../services/aiService'
import { useIDEStore } from '../store/ideStore'
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
  theme?: 'vs-dark' | 'light'
  target?: EditorTarget | null
  aiConfig?: AIConfig
  inlineCompletionEnabled?: boolean
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
  allFiles = [],
  onChange,
  onDiagnosticsChange,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const editorRef = useRef<MonacoEditorInstance | null>(null)
  const allFilesRef = useRef(allFiles)
  const aiConfigRef = useRef(aiConfig)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setEditorTarget = useIDEStore((s) => s.setEditorTarget)
  aiConfigRef.current = aiConfig
  allFilesRef.current = allFiles

  useEffect(() => {
    if (allFiles.length === 0) return
    syncMonacoTypeScriptProject(
      allFiles.map((file) => ({
        name: file.name,
        content: file.content,
        language: file.language ?? 'javascript',
      })),
    )
  }, [allFiles])

  useEffect(() => {
    if (!filename || allFiles.length === 0) return
    const definitionDisposable = registerCrossFileDefinitionProvider(allFiles, filename)
    const referenceDisposable = registerCrossFileReferenceProvider(allFiles)
    return () => {
      definitionDisposable.dispose()
      referenceDisposable.dispose()
    }
  }, [allFiles, filename])

  useEffect(() => {
    const disposable = monaco.editor.registerEditorOpener({
      openCodeEditor(_source, resource, selectionOrPosition) {
        const rawPath = resource.path.replace(/^inmemory:\/\//, '').replace(/^\//, '')
        const nav = resolveDefinitionNavigation(allFilesRef.current, rawPath)
        if (!nav) return false

        setActiveFile(nav.fileIndex)
        const line =
          selectionOrPosition && 'startLineNumber' in selectionOrPosition
            ? selectionOrPosition.startLineNumber
            : nav.line
        setEditorTarget({ line, column: 1, nonce: Date.now() })
        return true
      },
    })
    return () => disposable.dispose()
  }, [setActiveFile, setEditorTarget])

  useEffect(() => {
    if (!isLoading) return

    const timeoutId = window.setTimeout(() => {
      setLoadError('Monaco 编辑器加载超时，请检查本地构建资源是否可访问。')
      setIsLoading(false)
    }, 12000)

    return () => window.clearTimeout(timeoutId)
  }, [isLoading])

  useEffect(() => {
    if (!inlineCompletionEnabled || !aiConfig) return

    const disposable = registerInlineCompletionProvider({
      language,
      filename,
      getConfig: () => aiConfigRef.current ?? aiConfig,
      enabled: () => inlineCompletionEnabled && !!aiConfigRef.current,
    })

    return () => disposable.dispose()
  }, [language, filename, inlineCompletionEnabled, aiConfig?.provider, aiConfig?.apiKey])

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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <SkeletonLoader theme={theme === 'vs-dark' ? 'dark' : 'light'} />
        </div>
      )}

      {loadError && (
        <div className="editor-load-error">
          <strong>编辑器加载失败</strong>
          <span>{loadError}</span>
          <button
            onClick={() => {
              setLoadError(null)
              setIsLoading(true)
              window.location.reload()
            }}
          >
            重新加载
          </button>
        </div>
      )}

      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        theme={theme}
        loading={null}
        onMount={(editor) => {
          editorRef.current = editor
          setIsLoading(false)
          setLoadError(null)
        }}
        onValidate={(markers) => onDiagnosticsChange?.(markers)}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
          folding: true,
          renderLineHighlight: 'line',
          matchBrackets: 'always',
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
