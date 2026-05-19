import { FileText, Shield, Sparkles, TerminalSquare, X } from 'lucide-react'
import Editor from '../components/Editor'
import Terminal from '../components/Terminal'
import type { ToastKind } from '../components/FeedbackCenter'
import { PreviewPanel } from './lazyPanels'
import { useIDEStore } from '../store/ideStore'

interface EditorLayoutProps {
  isRunning: boolean
  runtimeError: Error | null
  output: string[]
  onRunCode: () => void
  onClearTerminal: () => void
  onRetryRuntime: () => void
  onFileChange: (value: string | undefined) => void
  onDeleteFile: (index: number) => void
  onOpenSnippetPanel: () => void
  onOpenCodeReviewPanel: () => void
  onToggleTerminal: () => void
  notify: (kind: ToastKind, title: string, detail?: string) => void
}

export function EditorLayout({
  isRunning,
  runtimeError,
  output,
  onRunCode,
  onClearTerminal,
  onRetryRuntime,
  onFileChange,
  onDeleteFile,
  onOpenSnippetPanel,
  onOpenCodeReviewPanel,
  onToggleTerminal,
  notify,
}: EditorLayoutProps) {
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const theme = useIDEStore((s) => s.theme)
  const editorTarget = useIDEStore((s) => s.editorTarget)
  const showTerminal = useIDEStore((s) => s.showTerminal)
  const showPreview = useIDEStore((s) => s.showPreview)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setDiagnosticCount = useIDEStore((s) => s.setDiagnosticCount)
  const setShowPreview = useIDEStore((s) => s.setShowPreview)
  const aiConfig = useIDEStore((s) => s.aiConfig)

  const currentFile = files[activeFile]

  return (
    <div className="editor-container">
      {runtimeError && (
        <div className="runtime-alert">
          <div>
            <strong>运行环境启动失败</strong>
            <span>{runtimeError.message}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onRetryRuntime()
              notify('info', '正在重新启动运行环境')
            }}
          >
            重试
          </button>
        </div>
      )}

      <div className="tabs">
        {files.map((file, idx) => (
          <div
            key={idx}
            className={`tab ${idx === activeFile ? 'active' : ''}`}
            onClick={() => setActiveFile(idx)}
          >
            <FileText size={13} />
            <span className="tab-label">{file.name}</span>
            <span
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteFile(idx)
              }}
            >
              <X size={12} />
            </span>
          </div>
        ))}
      </div>

      <div className="editor-info-bar">
        <div className="editor-info-main">
          <div className="editor-info-title">
            <FileText size={14} />
            <span>{currentFile?.name || 'Untitled'}</span>
          </div>
          <div className="editor-info-meta">
            <span>{currentFile?.language || 'plaintext'}</span>
            <span>{currentFile?.content.split('\n').length || 0} 行</span>
            <span>{currentFile?.content.length || 0} 字符</span>
          </div>
        </div>
        <div className="editor-info-actions">
          <button type="button" onClick={onOpenSnippetPanel} title="打开代码片段库">
            <Sparkles size={14} />
            <span>片段</span>
          </button>
          <button type="button" onClick={onOpenCodeReviewPanel} title="AI 代码审查">
            <Shield size={14} />
            <span>审查</span>
          </button>
          <button type="button" onClick={onToggleTerminal} title="显示终端">
            <TerminalSquare size={14} />
            <span>{showTerminal ? '隐藏终端' : '终端'}</span>
          </button>
        </div>
      </div>

      <div className="monaco-wrapper">
        <Editor
          value={currentFile?.content || ''}
          language={currentFile?.language || 'javascript'}
          filename={currentFile?.name || 'untitled'}
          theme={theme}
          target={editorTarget}
          aiConfig={aiConfig}
          allFiles={files.map((file) => ({
            name: file.name,
            content: file.content,
            language: file.language,
          }))}
          inlineCompletionEnabled={!!aiConfig.apiKey || aiConfig.provider === 'ollama'}
          onChange={onFileChange}
          onDiagnosticsChange={(markers) => setDiagnosticCount(markers.length)}
        />
      </div>

      {showTerminal && (
        <Terminal output={output} isRunning={isRunning} onRun={onRunCode} onClear={onClearTerminal} />
      )}

      {showPreview && (
        <PreviewPanel
          content={currentFile?.content || ''}
          fileName={currentFile?.name || ''}
          onClose={() => setShowPreview(false)}
          onRefresh={() => {}}
        />
      )}
    </div>
  )
}
