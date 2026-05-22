import { FeedbackCenter } from '../components/FeedbackCenter'
import { PluginModal } from '../components/PluginModal'
import { useBillingReturn } from '../hooks/useBillingReturn'
import { usePluginHost } from '../hooks/usePluginHost'
import { useAppBootstrap } from '../hooks/useAppBootstrap'
import { useAppShortcuts } from '../hooks/useAppShortcuts'
import { useEditorActions } from '../hooks/useEditorActions'
import { useFileActions } from '../hooks/useFileActions'
import { useFileEditor } from '../hooks/useFileEditor'
import { useUIActions } from '../hooks/useUIActions'
import { useWebContainer } from '../hooks/useWebContainer'
import { useCollaborationSync } from '../hooks/useCollaborationSync'
import { useGitStatus } from '../hooks/useGitStatus'
import { useMcpBootstrap } from '../hooks/useMcpBootstrap'
import { useProjectIndexSync } from '../hooks/useProjectIndexSync'
import { useSessionGuard } from '../hooks/useSessionGuard'
import { useWorkspacePersistence } from '../hooks/useWorkspacePersistence'
import { useI18n } from '../i18n'
import { useIDEStore } from '../store/ideStore'
import { AppToolbar } from './AppToolbar'
import { EditorLayout } from './EditorLayout'
import { FileSidebar } from './FileSidebar'
import { getLanguageFromExt } from './getLanguageFromExt'
import { SearchPanel } from './lazyPanels'
import { PanelHost } from './PanelHost'
import { RightPanel } from './RightPanel'
import { useAppFeedback } from './useAppFeedback'
import { loadWorkspaceByRef } from '../services/workspaceLoader'
import type { EditorTheme } from '../store/ideStore'

export function AppShell() {
  const { language, t } = useI18n()
  const theme = useIDEStore((s) => s.theme)
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const newFileName = useIDEStore((s) => s.newFileName)
  const autoSaveEnabled = useIDEStore((s) => s.autoSaveEnabled)
  const currentUser = useIDEStore((s) => s.currentUser)
  const showSearchPanel = useIDEStore((s) => s.showSearchPanel)
  const setShowSearchPanel = useIDEStore((s) => s.setShowSearchPanel)
  const setFiles = useIDEStore((s) => s.setFiles)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setEditorTarget = useIDEStore((s) => s.setEditorTarget)
  const setNewFileName = useIDEStore((s) => s.setNewFileName)
  const setShowDropZone = useIDEStore((s) => s.setShowDropZone)
  const setShowNewFileInput = useIDEStore((s) => s.setShowNewFileInput)
  const setAiConfig = useIDEStore((s) => s.setAiConfig)
  const setShowAISettings = useIDEStore((s) => s.setShowAISettings)
  const setShowTemplateModal = useIDEStore((s) => s.setShowTemplateModal)
  const setShowTerminal = useIDEStore((s) => s.setShowTerminal)
  const setTheme = useIDEStore((s) => s.setTheme)
  const setAutoSaveEnabled = useIDEStore((s) => s.setAutoSaveEnabled)
  const setShowWelcome = useIDEStore((s) => s.setShowWelcome)

  const { toasts, confirmRequest, dismissToast, notify, requestConfirm, resolveConfirm } = useAppFeedback()

  const handleOpenRecentWorkspace = async (workspaceId: string) => {
    setShowWelcome(false)
    const loaded = await loadWorkspaceByRef(workspaceId)
    if (!loaded || loaded.files.length === 0) {
      notify('error', t('notify.projectOpenFailed'), t('notify.projectOpenFailedDetail'))
      return
    }
    setFiles(loaded.files)
    setActiveFile(0)
    if (loaded.settings?.theme) setTheme(loaded.settings.theme as EditorTheme)
    if (loaded.settings?.autoSave !== undefined) setAutoSaveEnabled(loaded.settings.autoSave)
    notify('success', t('notify.projectOpened'), loaded.name || `${loaded.files.length}`)
  }

  const handleTestsGenerated = (fileName: string, content: string) => {
    setFiles((prev) => {
      const next = [...prev, { name: fileName, content, language: getLanguageFromExt(fileName) }]
      setActiveFile(next.length - 1)
      return next
    })
    notify('success', t('notify.testFileAdded'), fileName)
  }

  const {
    isReady,
    isLoading: isRuntimeLoading,
    error: runtimeError,
    output,
    isRunning,
    writeFile,
    runNode,
    retry: retryRuntime,
    fs,
  } = useWebContainer()

  useAppBootstrap()
  useSessionGuard(notify)
  useMcpBootstrap()
  useProjectIndexSync()
  const gitStatus = useGitStatus(fs, files)
  useCollaborationSync()
  useBillingReturn(notify)

  usePluginHost({ notify, terminalOutput: output })

  useWorkspacePersistence({
    autoSaveEnabled,
    currentUser,
    files,
    language,
    theme,
  })

  const { handleFileChange } = useFileEditor({ activeFile, setFiles })

  const {
    handleCreateFile,
    handleDeleteFile,
    handleExportFile,
    handleExportZip,
    handleImportFiles,
    handleSearchNavigate,
    handleSearchReplace,
  } = useFileActions({
    activeFile,
    files,
    newFileName,
    notify,
    setActiveFile,
    setEditorTarget,
    setFiles,
    setNewFileName,
    setShowDropZone,
    setShowNewFileInput,
    getLanguageFromExt,
  })

  const { clearTerminal, handleApplyTemplate, handleRunCode, handleRunNpmScript, handleSaveAISettings, toggleTheme } =
    useEditorActions({
      activeFile,
      files,
      isReady,
      notify,
      runNode,
      setActiveFile,
      setAiConfig,
      setFiles,
      setShowAISettings,
      setShowTemplateModal,
      setShowTerminal,
      setTheme,
      theme,
      writeFile,
    })

  const ui = useUIActions()

  useAppShortcuts({
    files,
    handleRunCode,
    openCommandPalette: ui.openCommandPalette,
    openImportDialog: ui.openImportDialog,
    openNewFileInput: ui.openNewFileInput,
    openSearchPanel: ui.openSearchPanel,
    toggleTerminalPanel: ui.toggleTerminalPanel,
  })

  const runStatusText = runtimeError
    ? '运行环境异常'
    : isRunning
      ? '运行中'
      : isReady
        ? '运行环境已就绪'
        : isRuntimeLoading
          ? '正在准备运行环境'
          : '运行环境未就绪'

  return (
    <div className={`app ${theme === 'light' ? 'light-theme' : ''}`}>
      <AppToolbar
        isReady={isReady}
        isRunning={isRunning}
        runtimeError={runtimeError}
        runStatusText={runStatusText}
        onRunCode={handleRunCode}
        onOpenNewFile={ui.openNewFileInput}
        onOpenSearch={ui.openSearchPanel}
        onOpenChat={ui.openChatPanel}
        onOpenWorkspace={ui.openWorkspaceManagerModal}
        onToggleGit={ui.toggleGitPanel}
        onOpenPreview={ui.openPreviewPanel}
        onOpenCommandPalette={ui.openCommandPalette}
        onOpenSettings={ui.openSettingsPanel}
        onOpenWelcome={ui.openWelcomeScreen}
        onOpenAuth={ui.openAuthDialog}
        onOpenSubscription={ui.openSubscriptionDialog}
        requestConfirm={requestConfirm}
        notify={notify}
      />

      <div className="workspace">
        <FileSidebar
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
          onOpenDropZone={ui.openDropZone}
        />

        {showSearchPanel && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '320px', zIndex: 100 }}>
            <SearchPanel
              files={files}
              onNavigate={handleSearchNavigate}
              onReplace={handleSearchReplace}
              onClose={() => setShowSearchPanel(false)}
            />
          </div>
        )}

        <EditorLayout
          isRunning={isRunning}
          runtimeError={runtimeError}
          output={output}
          onRunCode={handleRunCode}
          onClearTerminal={clearTerminal}
          onRetryRuntime={retryRuntime}
          onFileChange={handleFileChange}
          onDeleteFile={handleDeleteFile}
          onOpenSnippetPanel={ui.openSnippetPanel}
          onOpenCodeReviewPanel={ui.openCodeReviewPanel}
          onToggleTerminal={ui.toggleTerminalPanel}
          notify={notify}
        />

        <RightPanel fs={fs} notify={notify} onCloseGit={ui.closeGitPanel} onCloseChat={ui.closeChatPanel} />
      </div>

      <PanelHost
        notify={notify}
        requestConfirm={requestConfirm}
        onApplyTemplate={handleApplyTemplate}
        onSaveAISettings={handleSaveAISettings}
        onImportFiles={handleImportFiles}
        onExportFile={handleExportFile}
        onExportZip={handleExportZip}
        onRunCode={handleRunCode}
        onRunNpmScript={handleRunNpmScript}
        onToggleTheme={toggleTheme}
        closeCommandPalette={ui.closeCommandPalette}
        closeSettingsPanel={ui.closeSettingsPanel}
        openNewFileInput={ui.openNewFileInput}
        openSettingsPanel={ui.openSettingsPanel}
        openGitPanel={ui.openGitPanel}
        openShareDialog={ui.openShareDialog}
        openChatPanel={ui.openChatPanel}
        openSnippetPanel={ui.openSnippetPanel}
        openTerminalPanel={ui.openTerminalPanel}
        openPreviewPanel={ui.openPreviewPanel}
        openCodeReviewPanel={ui.openCodeReviewPanel}
        openPerformanceDialog={ui.openPerformanceDialog}
        openPluginDialog={ui.openPluginDialog}
        openCollaborationDialog={ui.openCollaborationDialog}
        openImportDialog={ui.openImportDialog}
        openSearchPanel={ui.openSearchPanel}
        closeWelcomeAnd={ui.closeWelcomeAnd}
        openWorkspaceManagerModal={ui.openWorkspaceManagerModal}
        openWorkspacePanelModal={ui.openWorkspacePanelModal}
        openTemplateModal={ui.openTemplateModal}
        openThemeSelector={ui.openThemeSelector}
        openWelcomeScreen={ui.openWelcomeScreen}
        onOpenRecentWorkspace={handleOpenRecentWorkspace}
        onTestsGenerated={handleTestsGenerated}
        isRunning={isRunning}
        output={output}
        isWebContainerReady={isReady}
        gitBranch={gitStatus.branch}
        gitModified={gitStatus.modifiedCount}
      />

      <FeedbackCenter
        toasts={toasts}
        confirmRequest={confirmRequest}
        onDismissToast={dismissToast}
        onResolveConfirm={resolveConfirm}
      />
      <PluginModal />
    </div>
  )
}
