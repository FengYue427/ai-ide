import { FileText, GitCompare, Shield, Sparkles, TerminalSquare, X } from 'lucide-react'
import { isAiConfigured } from '../lib/aiPlatformMode'
import { isTabCompletionEnabled } from '../lib/inlineCompletionPrefs'
import { useI18n } from '../i18n'
import Editor from '../components/Editor'
import { ReferencesPeekBar } from '../components/ReferencesPeekBar'
import { GitDiffEditor } from '../components/GitDiffEditor'
import BottomPanel from '../components/BottomPanel'
import type { ToastKind } from '../components/FeedbackCenter'
import { collabRoleCanWrite } from '../lib/collabPermissions'
import { summarizeMonacoMarkers } from '../editor/summarizeMonacoMarkers'
import { useIDEStore } from '../store/ideStore'
import { gitDiffTabKey } from '../types/editorTab'
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
  onStartDebug: () => void
  onStopDebug: () => void
  onDebugContinue: () => void
  onDebugStepOver: () => void
  onDebugStepInto: () => void
  onDebugStepOut: () => void
  debugSessionActive: boolean
  onRetryRuntime: () => void
  onFileChange: (value: string | undefined) => void
  onDeleteFile: (index: number) => void
  onCloseGitDiffTab: (index: number) => void
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
  onStartDebug,
  onStopDebug,
  onDebugContinue,
  onDebugStepOver,
  onDebugStepInto,
  onDebugStepOut,
  debugSessionActive,
  onRetryRuntime,
  onFileChange,
  onDeleteFile,
  onCloseGitDiffTab,
  onOpenSnippetPanel,
  onOpenCodeReviewPanel,
  onToggleTerminal,
  notify,
}: EditorLayoutProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const gitDiffTabs = useIDEStore((s) => s.gitDiffTabs)
  const activeFile = useIDEStore((s) => s.activeFile)
  const activeEditorSurface = useIDEStore((s) => s.activeEditorSurface)
  const activeGitDiffTab = useIDEStore((s) => s.activeGitDiffTab)
  const theme = useIDEStore((s) => s.theme)
  const editorTarget = useIDEStore((s) => s.editorTarget)
  const referencesPeek = useIDEStore((s) => s.referencesPeek)
  const showTerminal = useIDEStore((s) => s.showTerminal)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setActiveGitDiffTab = useIDEStore((s) => s.setActiveGitDiffTab)
  const setDiagnosticSummary = useIDEStore((s) => s.setDiagnosticSummary)
  const aiConfig = useIDEStore((s) => s.aiConfig)
  const currentUser = useIDEStore((s) => s.currentUser)
  const collaborationRoomId = useIDEStore((s) => s.collaborationRoomId)
  const collaborationMemberRole = useIDEStore((s) => s.collaborationMemberRole)
  const collabReadOnly = Boolean(
    collaborationRoomId && !collabRoleCanWrite(collaborationMemberRole),
  )

  const currentFile = files[activeFile]
  const currentDiffTab = gitDiffTabs[activeGitDiffTab]
  const showingDiff = activeEditorSurface === 'git-diff' && currentDiffTab

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

      <div className="editor-chrome">
        <div className="tabs">
          {files.map((file, idx) => (
            <div
              key={file.name}
              className={`tab ${activeEditorSurface === 'file' && idx === activeFile ? 'active' : ''}`}
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
          {gitDiffTabs.map((tab, idx) => (
            <div
              key={gitDiffTabKey(tab.path, tab.diffSource, tab.commitOid)}
              className={`tab tab--git-diff ${activeEditorSurface === 'git-diff' && idx === activeGitDiffTab ? 'active' : ''}`}
              onClick={() => setActiveGitDiffTab(idx)}
            >
              <GitCompare size={13} />
              <span className="tab-label">{tab.name}</span>
              <span
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseGitDiffTab(idx)
                }}
              >
                <X size={12} />
              </span>
            </div>
          ))}
        </div>
        <div className="editor-chrome-actions">
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

      <div className="editor-breadcrumb" aria-label={t('editor.breadcrumb')}>
        {showingDiff ? (
          <>
            <span>{currentDiffTab.language}</span>
            <span>{t('git.diffTabBadge')}</span>
            <span>
              {t('git.diffStats', {
                added: currentDiffTab.truncated
                  ? (currentDiffTab.originalNewLines ?? currentDiffTab.newContent.split('\n').length)
                  : currentDiffTab.newContent.split('\n').length,
                removed: currentDiffTab.truncated
                  ? (currentDiffTab.originalOldLines ?? currentDiffTab.oldContent.split('\n').length)
                  : currentDiffTab.oldContent.split('\n').length,
              })}
            </span>
          </>
        ) : (
          <>
            <span>{currentFile?.language || 'plaintext'}</span>
            <span>{t('editor.meta.lines', { count: currentFile?.content.split('\n').length || 0 })}</span>
            <span>{t('editor.meta.chars', { count: currentFile?.content.length || 0 })}</span>
          </>
        )}
      </div>

      {collabReadOnly ? (
        <div className="collab-readonly-banner" role="status">
          {t('collab.readOnlyBanner')}
        </div>
      ) : null}

      {showingDiff && currentDiffTab.truncated ? (
        <div className="git-diff-truncated-banner" role="status">
          {t('git.diffTruncatedBanner', {
            oldShown: currentDiffTab.shownOldLines ?? currentDiffTab.oldContent.split('\n').length,
            oldTotal: currentDiffTab.originalOldLines ?? currentDiffTab.oldContent.split('\n').length,
            newShown: currentDiffTab.shownNewLines ?? currentDiffTab.newContent.split('\n').length,
            newTotal: currentDiffTab.originalNewLines ?? currentDiffTab.newContent.split('\n').length,
          })}
        </div>
      ) : null}

      {!showingDiff && referencesPeek ? (
        <ReferencesPeekBar
          peek={referencesPeek}
          files={files.map((file) => ({ name: file.name, content: file.content }))}
        />
      ) : null}

      <div className="monaco-wrapper">
        {showingDiff ? (
          <GitDiffEditor
            original={currentDiffTab.oldContent}
            modified={currentDiffTab.newContent}
            language={currentDiffTab.language}
            theme={theme}
            layout={currentDiffTab.layout ?? 'sideBySide'}
          />
        ) : (
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
              isTabCompletionEnabled() && isAiConfigured(aiConfig, Boolean(currentUser))
            }
            onChange={onFileChange}
            onDiagnosticsChange={(markers) => setDiagnosticSummary(summarizeMonacoMarkers(markers))}
          />
        )}
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
          onStartDebug={onStartDebug}
          onStopDebug={onStopDebug}
          onDebugContinue={onDebugContinue}
          onDebugStepOver={onDebugStepOver}
          onDebugStepInto={onDebugStepInto}
          onDebugStepOut={onDebugStepOut}
          debugSessionActive={debugSessionActive}
        />
      )}

    </div>
  )
}
