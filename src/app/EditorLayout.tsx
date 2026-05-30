import { FileText, Shield, Sparkles, TerminalSquare, X } from 'lucide-react'
import { isTabCompletionEnabled } from '../lib/inlineCompletionPrefs'
import { useI18n } from '../i18n'
import Editor from '../components/Editor'
import BottomPanel from '../components/BottomPanel'
import type { ToastKind } from '../components/FeedbackCenter'
import { PreviewPanel } from './lazyPanels'
import { collabRoleCanWrite } from '../lib/collabPermissions'
import { summarizeMonacoMarkers } from '../editor/summarizeMonacoMarkers'
import { useIDEStore } from '../store/ideStore'
import type { RunNpmScriptHandler } from '../lib/npmScriptRun'

interface EditorLayoutProps {
  isReady: boolean
  isRuntimeLoading: boolean
  isRunning: boolean
  runtimeError: Error | null
  writeFile: (path: string, content: string) => Promise<void>
  onRunCode: () => void
  onClearTerminal: () => void
  onRunNpmScript: RunNpmScriptHandler
  onOpenPackageJson?: () => void
  onOpenTaskFile: (path: string, line?: number) => void
  onCreateProjectTasks: () => void
  onSendOpenTasksToAgent: () => void
  onRetryRuntime: () => void
  onFileChange: (value: string | undefined) => void
  onDeleteFile: (index: number) => void
  onOpenSnippetPanel: () => void
  onOpenCodeReviewPanel: () => void
  onToggleTerminal: () => void
  notify: (kind: ToastKind, title: string, detail?: string) => void
}

export function EditorLayout({
  isReady,
  isRuntimeLoading,
  isRunning,
  runtimeError,
  writeFile,
  onRunCode,
  onClearTerminal,
  onRunNpmScript,
  onOpenPackageJson,
  onOpenTaskFile,
  onCreateProjectTasks,
  onSendOpenTasksToAgent,
  onRetryRuntime,
  onFileChange,
  onDeleteFile,
  onOpenSnippetPanel,
  onOpenCodeReviewPanel,
  onToggleTerminal,
  notify,
}: EditorLayoutProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const theme = useIDEStore((s) => s.theme)
  const editorTarget = useIDEStore((s) => s.editorTarget)
  const showTerminal = useIDEStore((s) => s.showTerminal)
  const showPreview = useIDEStore((s) => s.showPreview)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setDiagnosticSummary = useIDEStore((s) => s.setDiagnosticSummary)
  const setShowPreview = useIDEStore((s) => s.setShowPreview)
  const aiConfig = useIDEStore((s) => s.aiConfig)
  const collaborationRoomId = useIDEStore((s) => s.collaborationRoomId)
  const collaborationMemberRole = useIDEStore((s) => s.collaborationMemberRole)
  const collabReadOnly = Boolean(
    collaborationRoomId && !collabRoleCanWrite(collaborationMemberRole),
  )

  const currentFile = files[activeFile]

  return (
    <div className="editor-container">
      {runtimeError && (
        <div className="runtime-alert">
          <div>
            <strong>{t('editor.runtimeFailed')}</strong>
            <span>{runtimeError.message}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onRetryRuntime()
              notify('info', t('editor.restarting'))
            }}
          >
            {t('editor.runtimeRetry')}
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
            <span>{t('editor.meta.lines', { count: currentFile?.content.split('\n').length || 0 })}</span>
            <span>{t('editor.meta.chars', { count: currentFile?.content.length || 0 })}</span>
          </div>
        </div>
        <div className="editor-info-actions">
          <button type="button" onClick={onOpenSnippetPanel} title={t('editor.action.snippetTitle')}>
            <Sparkles size={14} />
            <span>{t('editor.action.snippet')}</span>
          </button>
          <button type="button" onClick={onOpenCodeReviewPanel} title={t('editor.action.reviewTitle')}>
            <Shield size={14} />
            <span>{t('editor.action.review')}</span>
          </button>
          <button type="button" onClick={onToggleTerminal} title={t('editor.action.terminalTitle')}>
            <TerminalSquare size={14} />
            <span>{showTerminal ? t('editor.action.hideTerminal') : t('editor.action.terminal')}</span>
          </button>
        </div>
      </div>

      {collabReadOnly ? (
        <div className="collab-readonly-banner" role="status">
          {t('collab.readOnlyBanner')}
        </div>
      ) : null}

      <div className="monaco-wrapper">
        <Editor
          readOnly={collabReadOnly}
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
          inlineCompletionEnabled={
            isTabCompletionEnabled() && (!!aiConfig.apiKey || aiConfig.provider === 'ollama')
          }
          onChange={onFileChange}
          onDiagnosticsChange={(markers) => setDiagnosticSummary(summarizeMonacoMarkers(markers))}
        />
      </div>

      {showTerminal && (
        <BottomPanel
          isReady={isReady}
          isLoading={isRuntimeLoading}
          isRunning={isRunning}
          readOnly={collabReadOnly}
          theme={theme === 'light' ? 'light' : 'vs-dark'}
          writeFile={writeFile}
          onRunCode={onRunCode}
          onClearTerminal={onClearTerminal}
          onRunNpmScript={onRunNpmScript}
          onOpenPackageJson={onOpenPackageJson}
          onOpenTaskFile={onOpenTaskFile}
          onCreateProjectTasks={onCreateProjectTasks}
          onSendOpenTasksToAgent={onSendOpenTasksToAgent}
        />
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
