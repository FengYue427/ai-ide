import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { FeedbackCenter } from '../components/FeedbackCenter'
import { DesktopReturnPrompt } from '../components/DesktopReturnPrompt'
import { PluginModal } from '../components/PluginModal'
import { PanelResizeHandle } from '../components/PanelResizeHandle'
import { useBillingReturn } from '../hooks/useBillingReturn'
import { useDesktopShellReturn } from '../hooks/useDesktopShellReturn'
import { useDesktopDeepLink } from '../hooks/useDesktopDeepLink'
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
import { useNarrowViewport } from '../hooks/useNarrowViewport'
import { useUIActions } from '../hooks/useUIActions'
import { useWebContainer } from '../hooks/useWebContainer'
import { isDesktopApp } from '../services/desktopBridge'
import { hasNativeProjectRoot, resolveRuntimeStatusKind } from '../lib/platformParity'
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
import { OPEN_BACKGROUND_JOBS_PANEL_EVENT, dispatchOpenBackgroundJobsPanel } from '../lib/backgroundJobsPanelEvents'
import type { LinkageOverlayNavigateTarget } from '../lib/linkageOverlayNavigation'
import { loadWorkspaceByRef } from '../services/workspaceLoader'
import { markWorkspaceHydrated } from '../services/workspaceSession'
import { collabRoleCanWrite } from '../lib/collabPermissions'
import { stageAllInWorkspace } from '../lib/gitQuickActions'
import { useIntentQueueRail } from '../hooks/useIntentQueueRail'
import { useAutopilotLite } from '../hooks/useAutopilotLite'
import { useAutopilotBackgroundWatch } from '../hooks/useAutopilotBackgroundWatch'
import { useAutopilotGoalDrive } from '../hooks/useAutopilotGoalDrive'
import { GoalDriveAutopilotDialog } from '../components/GoalDriveAutopilotDialog'
import { useSpecTaskActions } from '../hooks/useSpecTaskActions'
import { useIntentShellNarrowLayout } from '../hooks/useIntentShellNarrowLayout'
import { useWorkspaceMode } from '../hooks/useWorkspaceMode'
import { useSessionResumeSync } from '../hooks/useSessionResumeSync'
import { useLearningPathProgressSync } from '../hooks/useLearningPathProgressSync'
import { useAideLinkEmitters } from '../hooks/useAideLinkEmitters'
import { useProjectLayoutSync } from '../hooks/useProjectLayoutSync'
import { useWorkbenchLayoutPersistence } from '../hooks/useWorkbenchLayoutPersistence'
import { TodayFocusBar } from '../components/TodayFocusBar'
import { readCapstoneFunnel } from '../lib/capstoneFunnel'
import type { LearningPath } from '../lib/learningPaths'
import { markLearningPathStarted } from '../lib/learningPathProgress'
import {
  clearSessionResumeDismiss,
  isSessionResumeBarDismissed,
  isSessionResumeStale,
  loadSessionResume,
} from '../lib/sessionResume'
import { getSessionResumeMaxAgeMs } from '../lib/clientPlanEntitlements'
import { getActiveAuxiliarySlot } from '../lib/workbenchLayout'
import { saveIntentShellPreference, shouldShowIntentShell } from '../lib/intentShellFeatures'
import { buildSpecStatusSummary } from '../lib/specStatusSummary'
import { inferSuggestedWorkspaceMode, isPlanFilePath } from '../lib/workspaceModeSuggestions'

const IntentShellBar = lazy(() =>
  import('../components/IntentShellBar').then((m) => ({ default: m.IntentShellBar })),
)
const IntentShellLeftRail = lazy(() =>
  import('../components/IntentShellLeftRail').then((m) => ({ default: m.IntentShellLeftRail })),
)
const IntentShellQueueRail = lazy(() =>
  import('../components/IntentShellQueueRail').then((m) => ({ default: m.IntentShellQueueRail })),
)
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
  const currentPlan = useIDEStore((s) => s.currentPlan)
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
  const setIntentShellFocusTasksPath = useIDEStore((s) => s.setIntentShellFocusTasksPath)
  const showWelcome = useIDEStore((s) => s.showWelcome)
  const setAcceptanceEditorPath = useIDEStore((s) => s.setAcceptanceEditorPath)
  const intentShellEnabled = useIDEStore((s) => s.intentShellEnabled)
  const setIntentShellEnabled = useIDEStore((s) => s.setIntentShellEnabled)
  const intentShellRailTab = useIDEStore((s) => s.intentShellRailTab)
  const setIntentShellRailTab = useIDEStore((s) => s.setIntentShellRailTab)
  const intentShellGraphOpen = useIDEStore((s) => s.intentShellGraphOpen)
  const setIntentShellGraphOpen = useIDEStore((s) => s.setIntentShellGraphOpen)
  const intentShellQueueRailOpen = useIDEStore((s) => s.intentShellQueueRailOpen)
  const setIntentShellQueueRailOpen = useIDEStore((s) => s.setIntentShellQueueRailOpen)
  const debugSessionPhase = useIDEStore((s) => s.debugSession.phase)

  const queuedSpecExecutions = useIDEStore((s) => s.queuedSpecExecutions)
  const queuedSpecBackfill = useIDEStore((s) => s.queuedSpecBackfill)
  const verifyingSpecBackfill = useIDEStore((s) => s.verifyingSpecBackfill)
  const failedSpecExecution = useIDEStore((s) => s.failedSpecExecution)

  const { toasts, confirmRequest, dismissToast, notify, requestConfirm, resolveConfirm } = useAppFeedback()
  useBackgroundJobsTracker(notify)
  const ui = useUIActions()
  const { workspaceMode, applyWorkspaceMode, initWorkspaceMode } = useWorkspaceMode()
  const [showResumeBar, setShowResumeBar] = useState(() => !isSessionResumeBarDismissed())
  const sessionSnapshot = useMemo(() => loadSessionResume(), [])
  useSessionResumeSync(!showWelcome)
  useLearningPathProgressSync(files, !showWelcome)
  useAideLinkEmitters(!showWelcome)
  useProjectLayoutSync(files, !showWelcome)

  useEffect(() => {
    initWorkspaceMode()
  }, [initWorkspaceMode])

  const handleSessionResume = useCallback(() => {
    const snap = loadSessionResume()
    if (!snap || isSessionResumeStale(snap, getSessionResumeMaxAgeMs(currentPlan ?? 'free'))) return
    setShowWelcome(false)
    applyWorkspaceMode(snap.workspaceMode)
    if (snap.activeFileName) {
      const idx = files.findIndex((f) => f.name === snap.activeFileName)
      if (idx >= 0) setActiveFile(idx)
    }
    if (snap.activeSpecPath) setIntentShellFocusTasksPath(snap.activeSpecPath)
    clearSessionResumeDismiss()
    setShowResumeBar(false)
  }, [applyWorkspaceMode, currentPlan, files, setActiveFile, setIntentShellFocusTasksPath, setShowWelcome])

  const handleStartLearningPath = useCallback(
    (path: LearningPath) => {
      markLearningPathStarted(path.id)
      ui.closeWelcomeAnd(() => {
        applyWorkspaceMode(path.suggestedMode)
        ui.openSpecStudio({ specName: path.specName, templateId: path.templateId })
      })
    },
    [applyWorkspaceMode, ui],
  )
  const { runFirstOpenSpecTask } = useSpecTaskActions(notify)
  const intentShellOn = shouldShowIntentShell(files, intentShellEnabled)
  const intentShellNarrow = useIntentShellNarrowLayout(intentShellOn)
  const {
    shellVisible: intentQueueVisible,
    panelProps: intentQueuePanelProps,
    replayManifest,
    replayLocked,
    restoreFromProof,
    focusTasksPath,
  } = useIntentQueueRail({ notify, openChatPanel: ui.openChatPanel })

  const openIntentShellPath = useCallback(
    (path: string) => {
      const normalized = path.replace(/\\/g, '/')
      if (normalized.endsWith('/acceptance.md')) {
        setAcceptanceEditorPath(normalized)
        return
      }
      const idx = files.findIndex((file) => file.name.replace(/\\/g, '/') === normalized)
      if (idx >= 0) {
        setActiveFile(idx)
        setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
        return
      }
      notify('info', t('tasksPanel.fileMissing'), normalized)
    },
    [files, notify, setAcceptanceEditorPath, setActiveFile, setEditorTarget, t],
  )

  const handleLinkageNavigate = useCallback(
    (target: LinkageOverlayNavigateTarget) => {
      if (target.kind === 'tasks') {
        openIntentShellPath(target.path)
        return
      }
      if (target.kind === 'git') {
        ui.openGitPanel()
        return
      }
      if (target.kind === 'background-jobs') {
        dispatchOpenBackgroundJobsPanel()
        return
      }
      if (target.kind === 'share') {
        useIDEStore.getState().setShowShareModal(true)
      }
    },
    [openIntentShellPath, ui],
  )

  const openCapstoneDoc = useCallback(
    (specSlug: string, doc: 'tasks' | 'acceptance') => {
      applyWorkspaceMode(doc === 'tasks' ? 'execute' : 'review')
      openIntentShellPath(`.aide/specs/${specSlug}/${doc}.md`)
    },
    [applyWorkspaceMode, openIntentShellPath],
  )

  const runCapstoneNext = useCallback(() => {
    const funnel = readCapstoneFunnel()
    if (!funnel) return
    applyWorkspaceMode('execute')
    runFirstOpenSpecTask(`.aide/specs/${funnel.specSlug}/tasks.md`)
  }, [applyWorkspaceMode, runFirstOpenSpecTask])

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
  useWorkbenchLayoutPersistence()
  useWorkspaceRootsMeta()
  useDesktopBootstrap()
  useBillingSync()
  useSessionGuard(notify, t)
  useApiErrorFeedback(notify, t, ui.openSettingsPanel)
  useMcpBootstrap()
  useProjectIndexSync()
  const gitStatus = useGitStatus(fs, files)
  const gitWriteDisabled = Boolean(collaborationRoomId && !collabRoleCanWrite(collaborationMemberRole))
  const gitModifiedTotal = gitStatus.modifiedCount + gitStatus.unstagedCount
  const linkageQueueBusy = Boolean(
    queuedSpecBackfill || verifyingSpecBackfill || failedSpecExecution || queuedSpecExecutions.length > 0,
  )

  const autopilot = useAutopilotLite(runFirstOpenSpecTask, { gitModifiedCount: gitModifiedTotal, notify })
  const backgroundWatch = useAutopilotBackgroundWatch(autopilot.tasksPath, {
    gitModifiedCount: gitModifiedTotal,
    queueBusy: linkageQueueBusy,
    quotaBlocked: autopilot.quotaBlocked,
    notify,
  })
  const goalDrive = useAutopilotGoalDrive({
    startLoop: autopilot.startLoop,
    startBackgroundWatch: backgroundWatch.startWatch,
    pauseLoop: autopilot.pauseLoop,
    pauseBackgroundWatch: backgroundWatch.pauseWatch,
    loopActive: autopilot.loopActive,
    backgroundWatchActive: backgroundWatch.watchActive,
    quotaBlocked: autopilot.quotaBlocked,
    gitModifiedCount: gitModifiedTotal,
    notify,
  })

  const specStatus = useMemo(() => buildSpecStatusSummary(files), [files])
  const suggestedWorkspaceMode = useMemo(
    () =>
      inferSuggestedWorkspaceMode({
        activeFileName: files[activeFile]?.name ?? null,
        workspaceMode,
        queueActive:
          !!queuedSpecBackfill || !!verifyingSpecBackfill || queuedSpecExecutions.length > 0,
        openTaskCount: specStatus.openTaskCount,
        gitModifiedCount: gitStatus.modifiedCount + gitStatus.unstagedCount,
        planFileOpen: isPlanFilePath(files[activeFile]?.name),
      }),
    [
      activeFile,
      files,
      gitStatus.modifiedCount,
      gitStatus.unstagedCount,
      queuedSpecBackfill,
      queuedSpecExecutions.length,
      specStatus.openTaskCount,
      verifyingSpecBackfill,
      workspaceMode,
    ],
  )

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
  useDesktopShellReturn(notify, t)
  useDesktopDeepLink(notify, t)

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
  const isNarrowViewport = useNarrowViewport()
  const { sidebarWidth, rightPanelWidth, auxiliaryWidth, intentShellLeftWidth, intentShellQueueWidth, setSidebarWidth, setRightPanelWidth, setAuxiliaryWidth, setIntentShellLeftWidth, setIntentShellQueueWidth, resetSidebarWidth, resetRightPanelWidth, resetAuxiliaryWidth, resetIntentShellLeftWidth, resetIntentShellQueueWidth } = usePanelWidth()
  const sidebarResize = usePanelResize(sidebarWidth, setSidebarWidth, 'right')
  const rightPanelResize = usePanelResize(rightPanelWidth, setRightPanelWidth, 'left')
  const auxiliaryResize = usePanelResize(auxiliaryWidth, setAuxiliaryWidth, 'right')
  const intentShellLeftResize = usePanelResize(intentShellLeftWidth, setIntentShellLeftWidth, 'right')
  const intentShellQueueResize = usePanelResize(intentShellQueueWidth, setIntentShellQueueWidth, 'left')

  // Narrow screen: auto-hide sidebar when right panel or auxiliary is open
  const showSearchPanel = useIDEStore((s) => s.showSearchPanel)
  const showPreview = useIDEStore((s) => s.showPreview)
  const showCodeReview = useIDEStore((s) => s.showCodeReview)
  const showPerformance = useIDEStore((s) => s.showPerformance)
  const showChatPanel = useIDEStore((s) => s.showChatPanel)
  const showGitPanel = useIDEStore((s) => s.showGitPanel)
  const auxiliaryOpen =
    getActiveAuxiliarySlot({ showSearchPanel, showPreview, showCodeReview, showPerformance }) !== 'none'
  const rightDockOpen = showChatPanel || showGitPanel
  const auxiliaryActive = auxiliaryOpen

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(max-width: 720px)')
    const handler = () => {
      if (mql.matches && (showChatPanel || showGitPanel || auxiliaryActive)) {
        setShowFileSidebar(false)
      }
    }
    handler()
    mql.addEventListener('change', handler)
    window.addEventListener('resize', handler)
    return () => {
      mql.removeEventListener('change', handler)
      window.removeEventListener('resize', handler)
    }
  }, [showChatPanel, showGitPanel, auxiliaryActive])

  const runtimeSurfaceReady = isDesktopApp() ? hasNativeProjectRoot() : isReady
  const runtimeKind = resolveRuntimeStatusKind(runtimeSurfaceReady)

  const runStatusText = runtimeError
    ? t('runtime.status.error')
    : debugSessionPhase === 'paused'
      ? t('debug.phase.paused')
      : debugSessionActive
        ? t(`debug.phase.${debugSessionPhase}`)
        : isRunning
          ? t('runtime.status.running')
          : runtimeKind === 'desktopReady' || runtimeKind === 'webReady'
            ? t('runtime.status.ready')
            : runtimeKind === 'desktopIdle'
              ? t('platform.runtime.desktopIdle')
              : isRuntimeLoading
                ? t('runtime.status.loading')
                : t('runtime.status.notReady')

  return (
    <div className={`app ${theme === 'light' ? 'light-theme' : ''}`}>
      <DesktopReturnPrompt />
      <AppToolbar
        isRunning={runtimeBusy}
        runtimeError={runtimeError}
        runStatusText={runStatusText}
        onOpenWorkspace={ui.openWorkspaceManagerModal}
        onOpenCommandPalette={ui.openCommandPalette}
        onOpenSettings={ui.openSettingsPanel}
        onOpenWelcome={ui.openWelcomeScreen}
        onOpenAuth={ui.openAuthDialog}
        onOpenSubscription={() => ui.openSubscriptionDialog('toolbar')}
        workspaceMode={workspaceMode}
        onWorkspaceModeChange={applyWorkspaceMode}
        requestConfirm={requestConfirm}
        notify={notify}
      />

      {!showWelcome ? (
        <>
          <TodayFocusBar
            workspaceMode={workspaceMode}
            specSlug={specStatus.activeSpecSlug}
            openTaskCount={specStatus.openTaskCount}
            sessionSnapshot={sessionSnapshot}
            showResume={showResumeBar}
            suggestedMode={suggestedWorkspaceMode}
            onContinueSession={handleSessionResume}
            onDismissResume={() => setShowResumeBar(false)}
            onApplySuggestedMode={applyWorkspaceMode}
            onSaveProof={intentQueuePanelProps.onSaveProof}
            onOpenShare={() => ui.openShareDialog('progress')}
            onCapstoneOpenTasks={(slug) => openCapstoneDoc(slug, 'tasks')}
            onCapstoneOpenAcceptance={(slug) => openCapstoneDoc(slug, 'acceptance')}
            onCapstoneRunNext={runCapstoneNext}
          />
        </>
      ) : null}

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

        <div
          className={[
            'workspace-main',
            !showFileSidebar ? 'workspace-main--no-sidebar' : '',
            isNarrowViewport ? 'workspace-main--narrow' : '',
            isNarrowViewport && showFileSidebar ? 'workspace-main--sidebar-drawer' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {isNarrowViewport && showFileSidebar ? (
            <button
              type="button"
              className="workspace-sidebar-backdrop"
              aria-label={t('common.close')}
              onClick={() => setShowFileSidebar(false)}
            />
          ) : null}
          {showFileSidebar ? (
            <>
              <FileSidebar
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onOpenDropZone={ui.openDropZone}
                onOpenSpecStudio={ui.openSpecStudio}
                onRunFirstOpenSpecTask={runFirstOpenSpecTask}
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
            {auxiliaryOpen ? (
              <>
                <WorkbenchAuxiliaryHost
                  files={files}
                  onSearchNavigate={handleSearchNavigate}
                  onSearchReplace={handleSearchReplace}
                  onCloseAuxiliary={ui.closeAuxiliaryPanel}
                  onTestsGenerated={handleTestsGenerated}
                  isRunning={runtimeBusy}
                  output={output}
                />
                <PanelResizeHandle
                  edge="right"
                  onPointerDown={auxiliaryResize.onResizePointerDown}
                  onPointerMove={auxiliaryResize.onResizePointerMove}
                  onPointerUp={auxiliaryResize.onResizePointerUp}
                  onDoubleClick={resetAuxiliaryWidth}
                  ariaLabel={t('panel.resizeAuxiliary')}
                />
              </>
            ) : null}

            <div
              className={[
                'workbench-editor-column',
                intentShellOn ? 'workbench-editor-column--intent-shell' : '',
                isNarrowViewport && rightDockOpen ? 'workbench-editor-column--panel-drawer' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {intentShellOn ? (
                <Suspense fallback={null}>
                <IntentShellBar
                  onOpenPath={openIntentShellPath}
                  onSaveProof={intentQueuePanelProps.onSaveProof}
                  onRunAutopilotNext={autopilot.suggestion ? autopilot.runNext : undefined}
                  onStartAutopilotLoop={
                    autopilot.suggestion && autopilot.openTaskCount > 1 ? autopilot.startLoop : undefined
                  }
                  onPauseAutopilotLoop={autopilot.loopActive ? autopilot.pauseLoop : undefined}
                  onStartBackgroundWatch={
                    backgroundWatch.enabled && autopilot.suggestion
                      ? backgroundWatch.startWatch
                      : undefined
                  }
                  onPauseBackgroundWatch={
                    backgroundWatch.watchActive ? backgroundWatch.pauseWatch : undefined
                  }
                  autopilotLoopActive={autopilot.loopActive}
                  autopilotLoopProgress={autopilot.loopProgress}
                  autopilotBackgroundWatchActive={backgroundWatch.watchActive}
                  autopilotBackgroundProgress={backgroundWatch.progress}
                  backgroundAgentEnabled={backgroundWatch.enabled}
                  onOpenGoalDrive={goalDrive.enabled ? goalDrive.openDialog : undefined}
                  onPauseGoalDrive={goalDrive.goalDriveActive ? goalDrive.pauseGoalDrive : undefined}
                  goalDriveActive={goalDrive.goalDriveActive}
                  autopilotTaskPreview={
                    autopilot.suggestion?.taskText
                      ? autopilot.suggestion.taskText.slice(0, 48)
                      : null
                  }
                  autopilotOpenCount={autopilot.openTaskCount}
                  autopilotQuota={autopilot.quota}
                  autopilotQuotaBlocked={autopilot.quotaBlocked}
                  linkageGitModifiedCount={gitModifiedTotal}
                  linkageQueueBusy={linkageQueueBusy}
                  lastGroundingBlock={intentQueuePanelProps.lastGroundingBlock}
                  onDismissGroundingBlock={intentQueuePanelProps.onDismissGroundingBlock}
                  narrowLayout={intentShellNarrow}
                  railTab={intentShellRailTab}
                  onRailTabChange={setIntentShellRailTab}
                  graphRailOpen={intentShellGraphOpen}
                  queueRailOpen={intentShellQueueRailOpen}
                  onReopenGraph={() => setIntentShellGraphOpen(true)}
                  onReopenQueue={() => setIntentShellQueueRailOpen(true)}
                  onToggleShell={() => {
                    saveIntentShellPreference(false)
                    setIntentShellEnabled(false)
                  }}
                />
                </Suspense>
              ) : null}
              <div className="workbench-editor-body">
                <div
                  className={[
                    'workbench-editor-row',
                    intentShellNarrow ? 'workbench-editor-row--intent-shell-narrow' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
              {intentShellOn && intentShellGraphOpen ? (
                <Suspense fallback={null}>
                <IntentShellLeftRail
                  focusTasksPath={focusTasksPath}
                  highlightTaskText={autopilot.suggestion?.taskText ?? null}
                  onOpenPath={openIntentShellPath}
                  drawerOpen={!intentShellNarrow || intentShellRailTab === 'graph'}
                  onClose={() => setIntentShellGraphOpen(false)}
                  linkageOpenTaskCount={autopilot.openTaskCount}
                  linkageGitModifiedCount={gitModifiedTotal}
                  linkageQueueBusy={linkageQueueBusy}
                  linkageQuotaBlocked={autopilot.quotaBlocked}
                  onLinkageNavigate={handleLinkageNavigate}
                />
                </Suspense>
              ) : null}
              {intentShellOn && intentShellGraphOpen && !intentShellNarrow ? (
                <PanelResizeHandle
                  edge="right"
                  onPointerDown={intentShellLeftResize.onResizePointerDown}
                  onPointerMove={intentShellLeftResize.onResizePointerMove}
                  onPointerUp={intentShellLeftResize.onResizePointerUp}
                  onDoubleClick={resetIntentShellLeftWidth}
                  ariaLabel={t('panel.resizeIntentGraph')}
                />
              ) : null}
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

              {intentShellOn && intentQueueVisible && intentShellQueueRailOpen && !intentShellNarrow ? (
                <PanelResizeHandle
                  edge="left"
                  onPointerDown={intentShellQueueResize.onResizePointerDown}
                  onPointerMove={intentShellQueueResize.onResizePointerMove}
                  onPointerUp={intentShellQueueResize.onResizePointerUp}
                  onDoubleClick={resetIntentShellQueueWidth}
                  ariaLabel={t('panel.resizeIntentQueue')}
                />
              ) : null}
              {intentShellOn && intentQueueVisible && intentShellQueueRailOpen ? (
                <Suspense fallback={null}>
                <IntentShellQueueRail
                  panelProps={intentQueuePanelProps}
                  replayAvailable={Boolean(replayManifest)}
                  replayLocked={replayLocked}
                  onRestoreFromProof={restoreFromProof}
                  onUpgrade={currentUser ? () => ui.openSubscriptionDialog('settings') : undefined}
                  onOpenChat={ui.openChatPanel}
                  drawerOpen={!intentShellNarrow || intentShellRailTab === 'queue'}
                  onClose={() => setIntentShellQueueRailOpen(false)}
                />
                </Suspense>
              ) : null}
              </div>

              {rightDockOpen ? (
                <>
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
                    onOpenSubscription={() => ui.openSubscriptionDialog('toolbar')}
                  />
                </>
              ) : null}
              </div>
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
        openSettingsToIntentGraph={ui.openSettingsToIntentGraph}
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
        openSpecStudio={ui.openSpecStudio}
        openThemeSelector={ui.openThemeSelector}
        openWelcomeScreen={ui.openWelcomeScreen}
        openRegisterDialog={ui.openRegisterDialog}
        onOpenRecentWorkspace={handleOpenRecentWorkspace}
        onTestsGenerated={handleTestsGenerated}
        isRunning={runtimeBusy}
        output={output}
        isWebContainerReady={runtimeSurfaceReady}
        gitBranch={gitStatus.branch}
        gitModified={gitModifiedTotal}
        gitUnstaged={gitStatus.unstagedCount}
        gitStageAllDisabled={gitWriteDisabled}
        onStageAll={handleStageAll}
        applyWorkspaceMode={applyWorkspaceMode}
        onSessionResume={handleSessionResume}
        onStartLearningPath={handleStartLearningPath}
      />

      <FeedbackCenter
        toasts={toasts}
        confirmRequest={confirmRequest}
        onDismissToast={dismissToast}
        onResolveConfirm={resolveConfirm}
      />
      <GoalDriveAutopilotDialog
        open={goalDrive.dialogOpen}
        onClose={() => goalDrive.setDialogOpen(false)}
        onSubmit={(goal) => {
          void goalDrive.startGoalDrive(goal)
        }}
        busy={goalDrive.busy}
      />
      <PluginModal />
    </div>
  )
}
