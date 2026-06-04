import { useCallback, useEffect, useState } from 'react'
import { FeedbackCenter } from '../components/FeedbackCenter'
import { PluginModal } from '../components/PluginModal'
import { PanelResizeHandle } from '../components/PanelResizeHandle'
import { useBillingReturn } from '../hooks/useBillingReturn'
import { useBillingSync } from '../hooks/useBillingSync'
import { usePluginHost } from '../hooks/usePluginHost'
import { useAppBootstrap } from '../hooks/useAppBootstrap'
import { useDesktopBootstrap } from '../hooks/useDesktopBootstrap'
import { useAppShortcuts } from '../hooks/useAppShortcuts'
import { useEditorActions } from '../hooks/useEditorActions'
import { useFileActions } from '../hooks/useFileActions'
import { useFileEditor } from '../hooks/useFileEditor'
import { usePanelWidth } from '../hooks/usePanelWidth'
import { usePanelResize } from '../hooks/usePanelResize'
import { useUIActions } from '../hooks/useUIActions'
import { useWebContainer } from '../hooks/useWebContainer'
import { useCollaborationSync } from '../hooks/useCollaborationSync'
import { useCollabRoleSync } from '../hooks/useCollabRoleSync'
import { useGitStatus } from '../hooks/useGitStatus'
import { useMcpBootstrap } from '../hooks/useMcpBootstrap'
import { useProjectIndexSync } from '../hooks/useProjectIndexSync'
import { useApiErrorFeedback } from '../hooks/useApiErrorFeedback'
import { useSessionGuard } from '../hooks/useSessionGuard'
import { useWorkspacePersistence } from '../hooks/useWorkspacePersistence'
import { useWorkspaceRootsMeta } from '../hooks/useWorkspaceRootsMeta'
import { useBackgroundJobsTracker } from '../hooks/useBackgroundJobsTracker'
import { useI18n } from '../i18n'
import { useIDEStore } from '../store/ideStore'
import { isDebugSessionActive } from '../lib/debugSessionActive'
import {
  buildOpenTasksAgentPrompt,
  collectAllTaskSources,
  createProjectTasksFileEntry,
  findTaskFileIndex,
  listOpenTasksFromGroups,
  listTaskFileGroups,
} from '../lib/projectTasksNavigation'
import { workspaceContextService } from '../services/workspaceContextService'
import { ActivityBar } from './ActivityBar'
import { AppToolbar } from './AppToolbar'
import { EditorLayout } from './EditorLayout'
import { FileSidebar } from './FileSidebar'
import { getLanguageFromExt } from './getLanguageFromExt'
import { PanelHost } from './PanelHost'
import { RightPanel } from './RightPanel'
import { WorkbenchAuxiliaryHost } from './WorkbenchAuxiliaryHost'
import { useAppFeedback } from './useAppFeedback'
import { OPEN_BACKGROUND_JOBS_PANEL_EVENT } from '../lib/backgroundJobsPanelEvents'
import { loadWorkspaceByRef } from '../services/workspaceLoader'
import { markWorkspaceHydrated } from '../services/workspaceSession'
import { collabRoleCanWrite } from '../lib/collabPermissions'
import { stageAllInWorkspace } from '../lib/gitQuickActions'
import type { EditorTheme } from '../store/ideStore'

export function AppShell() {
  const { language, t } = useI18n()
  const theme = useIDEStore((s) => s.theme)
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const newFileName = useIDEStore((s) => s.newFileName)
  const autoSaveEnabled = useIDEStore((s) => s.autoSaveEnabled)
  const formatOnSaveEnabled = useIDEStore((s) => s.formatOnSaveEnabled)
  const collaborationRoomId = useIDEStore((s) => s.collaborationRoomId)
  const collaborationMemberRole = useIDEStore((s) => s.collaborationMemberRole)
  const requestFormatDocument = useIDEStore((s) => s.requestFormatDocument)
  const currentUser = useIDEStore((s) => s.currentUser)
  const setFiles = useIDEStore((s) => s.setFiles)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const closeGitDiffTab = useIDEStore((s) => s.closeGitDiffTab)
  const setEditorTarget = useIDEStore((s) => s.setEditorTarget)
  const setNewFileName = useIDEStore((s) => s.setNewFileName)
  const setShowDropZone = useIDEStore((s) => s.setShowDropZone)
  const setShowNewFileInput = useIDEStore((s) => s.setShowNewFileInput)
  const setAiConfig = useIDEStore((s) => s.setAiConfig)
  const setShowAISettings = useIDEStore((s) => s.setShowAISettings)
  const setShowTemplateModal = useIDEStore((s) => s.setShowTemplateModal)
  const setShowTerminal = useIDEStore((s) => s.setShowTerminal)
  const setQueuedChatPrompt = useIDEStore((s) => s.setQueuedChatPrompt)
  const setTheme = useIDEStore((s) => s.setTheme)
  const setAutoSaveEnabled = useIDEStore((s) => s.setAutoSaveEnabled)
  const setShowWelcome = useIDEStore((s) => s.setShowWelcome)
  const showWelcome = useIDEStore((s) => s.showWelcome)
  const debugSessionPhase = useIDEStore((s) => s.debugSession.phase)

  const { toasts, confirmRequest, dismissToast, notify, requestConfirm, resolveConfirm } = useAppFeedback()
  useBackgroundJobsTracker(notify)
  const ui = useUIActions()

  const handleOpenRecentWorkspace = async (workspaceId: string) => {
    setShowWelcome(false)
    const loaded = await loadWorkspaceByRef(workspaceId)
    if (!loaded || loaded.files.length === 0) {
      notify('error', t('notify.projectOpenFailed'), t('notify.projectOpenFailedDetail'))
      return
    }
    setFiles(loaded.files)
    setActiveFile(0)
    markWorkspaceHydrated()
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
    spawnNodeInspectSession,
    retry: retryRuntime,
    fs,
  } = useWebContainer()

  const debugSessionActive = isDebugSessionActive(debugSessionPhase)
  const runtimeBusy = isRunning || debugSessionActive

  useAppBootstrap()
  useWorkspaceRootsMeta()
  useDesktopBootstrap()
  useBillingSync()
  useSessionGuard(notify, t)
  useApiErrorFeedback(notify, t, ui.openSettingsPanel)
  useMcpBootstrap()
  useProjectIndexSync()
  const gitStatus = useGitStatus(fs, files)
  const gitWriteDisabled = Boolean(collaborationRoomId && !collabRoleCanWrite(collaborationMemberRole))

  const handleStageAll = useCallback(async () => {
    if (!fs) {
      notify('info', t('git.waitRuntime'))
      return
    }
    if (gitWriteDisabled) {
      notify('info', t('git.readOnlyStage'))
      return
    }

    try {
      const { stagedCount, unstagedCount } = await stageAllInWorkspace({ fs, files })
      if (unstagedCount === 0 || stagedCount === 0) {
        notify('info', t('git.noUnstaged'))
        return
      }
      notify('success', t('git.stagedAll'), t('git.stagedAllDetail', { count: stagedCount }))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('git.actionFailed')
      notify('error', t('git.actionFailed'), message)
    }
  }, [files, fs, gitWriteDisabled, notify, t])
  useCollaborationSync()
  useCollabRoleSync(notify, t)
  useBillingReturn(notify, t)

  usePluginHost({ notify })

  useWorkspacePersistence({
    autoSaveEnabled,
    formatOnSaveEnabled,
    activeFile,
    collaborationRoomId,
    collaborationMemberRole,
    currentUser,
    files,
    uiLocale: language,
    theme,
    showWelcome,
    notify,
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
    t,
  })

  const {
    clearTerminal,
    handleApplyTemplate,
    handleRunCode,
    handleStartDebug,
    handleStopDebug,
    handleDebugContinue,
    handleDebugStepOver,
    handleDebugStepInto,
    handleDebugStepOut,
    handleRunNpmScript,
    handleSaveAISettings,
    toggleTheme,
  } = useEditorActions({
      activeFile,
      files,
      isReady,
      notify,
      runNode,
      spawnNodeInspectSession,
      setActiveFile,
      setAiConfig,
      setFiles,
      setShowAISettings,
      setShowTemplateModal,
      setShowTerminal,
      setTheme,
      theme,
      writeFile,
      t,
    })

  useEffect(() => {
    const openPanel = () => ui.openBackgroundJobsPanel()
    window.addEventListener(OPEN_BACKGROUND_JOBS_PANEL_EVENT, openPanel)
    return () => window.removeEventListener(OPEN_BACKGROUND_JOBS_PANEL_EVENT, openPanel)
  }, [ui.openBackgroundJobsPanel])

  useAppShortcuts({
    files,
    handleRunCode,
    handleDebugContinue,
    handleDebugStepOver,
    handleDebugStepInto,
    handleDebugStepOut,
    handleStopDebug,
    openCommandPalette: ui.openCommandPalette,
    openImportDialog: ui.openImportDialog,
    openNewFileInput: ui.openNewFileInput,
    openSearchPanel: ui.openSearchPanel,
    toggleTerminalPanel: ui.toggleTerminalPanel,
    toggleGitPanel: ui.toggleGitPanel,
    openTerminalPanel: ui.openTerminalPanel,
    openScriptsPanel: ui.openScriptsPanel,
    openTasksPanel: ui.openTasksPanel,
    openDebugPanel: ui.openDebugPanel,
    onFormat: () => requestFormatDocument(),
  })

  const [showFileSidebar, setShowFileSidebar] = useState(true)
  const { sidebarWidth, rightPanelWidth, setSidebarWidth, setRightPanelWidth, resetSidebarWidth, resetRightPanelWidth } = usePanelWidth()
  const sidebarResize = usePanelResize(sidebarWidth, setSidebarWidth, 'right')
  const rightPanelResize = usePanelResize(rightPanelWidth, setRightPanelWidth, 'left')

  // Narrow screen: auto-hide sidebar when right panel or auxiliary is open
  const showSearchPanel = useIDEStore((s) => s.showSearchPanel)
  const showPreview = useIDEStore((s) => s.showPreview)
  const showChatPanel = useIDEStore((s) => s.showChatPanel)
  const showGitPanel = useIDEStore((s) => s.showGitPanel)
  const auxiliaryActive = showSearchPanel || showPreview

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(max-width: 900px)')
    const handler = () => {
      if (mql.matches && (showChatPanel || showGitPanel || auxiliaryActive)) {
        setShowFileSidebar(false)
      }
    }
    handler()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [showChatPanel, showGitPanel, auxiliaryActive])

  const runStatusText = runtimeError
    ? t('runtime.status.error')
    : debugSessionPhase === 'paused'
      ? t('debug.phase.paused')
      : debugSessionActive
        ? t(`debug.phase.${debugSessionPhase}`)
        : isRunning
          ? t('runtime.status.running')
          : isReady
            ? t('runtime.status.ready')
            : isRuntimeLoading
              ? t('runtime.status.loading')
              : t('runtime.status.notReady')

  return (
    <div className={`app ${theme === 'light' ? 'light-theme' : ''}`}>
      <AppToolbar
        isRunning={runtimeBusy}
        runtimeError={runtimeError}
        runStatusText={runStatusText}
        onOpenWorkspace={ui.openWorkspaceManagerModal}
        onOpenCommandPalette={ui.openCommandPalette}
        onOpenSettings={ui.openSettingsPanel}
        onOpenWelcome={ui.openWelcomeScreen}
        onOpenAuth={ui.openAuthDialog}
        onOpenSubscription={ui.openSubscriptionDialog}
        requestConfirm={requestConfirm}
        notify={notify}
      />

      <div className="workspace-body">
        <ActivityBar
          showFileSidebar={showFileSidebar}
          onToggleFileSidebar={() => setShowFileSidebar((v) => !v)}
          onOpenSearch={ui.openSearchPanel}
          onOpenChat={ui.openChatPanel}
          onOpenBackgroundJobs={ui.openBackgroundJobsPanel}
          onToggleGit={ui.toggleGitPanel}
          onRunCode={handleRunCode}
          onOpenPreview={ui.openPreviewPanel}
          isRunning={runtimeBusy}
          isReady={isReady}
        />

        <div className={`workspace-main ${showFileSidebar ? '' : 'workspace-main--no-sidebar'}`}>
          {showFileSidebar ? (
            <>
              <FileSidebar
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onOpenDropZone={ui.openDropZone}
              />
              <PanelResizeHandle
                edge="right"
                onPointerDown={sidebarResize.onResizePointerDown}
                onPointerMove={sidebarResize.onResizePointerMove}
                onPointerUp={sidebarResize.onResizePointerUp}
                onDoubleClick={resetSidebarWidth}
                ariaLabel="Resize sidebar"
              />
            </>
          ) : null}

          <div className="workbench-center">
            <WorkbenchAuxiliaryHost
              files={files}
              onSearchNavigate={handleSearchNavigate}
              onSearchReplace={handleSearchReplace}
              onCloseAuxiliary={ui.closeAuxiliaryPanel}
              onTestsGenerated={handleTestsGenerated}
              isRunning={runtimeBusy}
              output={output}
            />

            <div className="workbench-editor-column">
              <div className="workspace">
                <EditorLayout
          isReady={isReady}
          isRuntimeLoading={isRuntimeLoading}
          isRunning={runtimeBusy}
          runtimeError={runtimeError}
          writeFile={writeFile}
          onRunCode={handleRunCode}
          onClearTerminal={clearTerminal}
          onRetryRuntime={retryRuntime}
          onRunNpmScript={handleRunNpmScript}
          onOpenPackageJson={() => {
            const idx = files.findIndex(
              (f) => f.name === 'package.json' || f.name.endsWith('/package.json'),
            )
            if (idx >= 0) {
              setActiveFile(idx)
              return
            }
            setFiles((prev) => {
              const next = [
                ...prev,
                {
                  name: 'package.json',
                  content:
                    '{\n  "name": "project",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  }\n}\n',
                  language: 'json',
                },
              ]
              setActiveFile(next.length - 1)
              return next
            })
          }}
          onOpenTaskFile={(path, line = 1) => {
            const idx = findTaskFileIndex(files, path)
            if (idx >= 0) {
              setActiveFile(idx)
            } else {
              notify('info', t('tasksPanel.fileMissing'), path)
              return
            }
            setEditorTarget({ line, column: 1, nonce: Date.now() })
          }}
          onCreateProjectTasks={() => {
            const idx = findTaskFileIndex(files, createProjectTasksFileEntry(language).name)
            if (idx >= 0) {
              setActiveFile(idx)
            } else {
              setFiles((prev) => {
                const next = [...prev, createProjectTasksFileEntry(language)]
                setActiveFile(next.length - 1)
                return next
              })
            }
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            useIDEStore.getState().setBottomPanelTab('tasks')
          }}
          onStartDebug={handleStartDebug}
          onStopDebug={handleStopDebug}
          onDebugContinue={handleDebugContinue}
          onDebugStepOver={handleDebugStepOver}
          onDebugStepInto={handleDebugStepInto}
          onDebugStepOut={handleDebugStepOut}
          debugSessionActive={debugSessionActive}
          onSendOpenTasksToAgent={() => {
            const sources = collectAllTaskSources(
              files.map((file) => ({ name: file.name, content: file.content })),
              workspaceContextService.getAllFiles(),
            )
            const open = listOpenTasksFromGroups(listTaskFileGroups(sources))
            const prompt = buildOpenTasksAgentPrompt(
              open.map((task) => ({ path: task.path, text: task.text })),
              language,
            )
            if (!prompt) {
              notify('info', t('tasksPanel.noOpenTasks'))
              return
            }
            setQueuedChatPrompt(prompt)
            ui.openChatPanel()
            notify('success', t('tasksPanel.agentQueued'), t('tasksPanel.agentQueuedDetail', { count: open.length }))
          }}
          onFileChange={handleFileChange}
          onDeleteFile={handleDeleteFile}
          onCloseGitDiffTab={closeGitDiffTab}
          onOpenSnippetPanel={ui.openSnippetPanel}
          onOpenCodeReviewPanel={ui.openCodeReviewPanel}
          onToggleTerminal={ui.toggleTerminalPanel}
          notify={notify}
        />
              </div>

              <PanelResizeHandle
                edge="left"
                onPointerDown={rightPanelResize.onResizePointerDown}
                onPointerMove={rightPanelResize.onResizePointerMove}
                onPointerUp={rightPanelResize.onResizePointerUp}
                onDoubleClick={resetRightPanelWidth}
                ariaLabel="Resize right panel"
              />
              <RightPanel
                fs={fs}
                notify={notify}
                onCloseGit={ui.closeGitPanel}
                onCloseChat={ui.closeChatPanel}
                onOpenAuth={ui.openAuthDialog}
                onOpenSubscription={ui.openSubscriptionDialog}
              />
            </div>
          </div>
        </div>
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
        onStartDebug={handleStartDebug}
        onStopDebug={handleStopDebug}
        onDebugContinue={handleDebugContinue}
        onDebugStepOver={handleDebugStepOver}
        onDebugStepInto={handleDebugStepInto}
        onDebugStepOut={handleDebugStepOut}
        onToggleTheme={toggleTheme}
        closeCommandPalette={ui.closeCommandPalette}
        closeSettingsPanel={ui.closeSettingsPanel}
        openNewFileInput={ui.openNewFileInput}
        openSettingsPanel={ui.openSettingsPanel}
        openGitPanel={ui.openGitPanel}
        openShareDialog={ui.openShareDialog}
        openChatPanel={ui.openChatPanel}
        openBackgroundJobsPanel={ui.openBackgroundJobsPanel}
        openSnippetPanel={ui.openSnippetPanel}
        openTerminalPanel={ui.openTerminalPanel}
        openScriptsPanel={ui.openScriptsPanel}
        openTasksPanel={ui.openTasksPanel}
        openDebugPanel={ui.openDebugPanel}
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
        openRegisterDialog={ui.openRegisterDialog}
        onOpenRecentWorkspace={handleOpenRecentWorkspace}
        onTestsGenerated={handleTestsGenerated}
        isRunning={runtimeBusy}
        output={output}
        isWebContainerReady={isReady}
        gitBranch={gitStatus.branch}
        gitModified={gitStatus.modifiedCount}
        gitUnstaged={gitStatus.unstagedCount}
        gitStageAllDisabled={gitWriteDisabled}
        onStageAll={handleStageAll}
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
