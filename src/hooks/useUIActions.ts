import { useCallback } from 'react'
import {
  patchCloseAuxiliary,
  patchOpenAuxiliary,
  patchOpenChatPanel,
  patchOpenGitPanel,
  patchToggleAuxiliary,
  patchToggleGitPanel,
} from '../lib/workbenchLayout'
import { useIDEStore } from '../store/ideStore'

export function useUIActions() {
  const applyLayout = useCallback((patch: ReturnType<typeof patchOpenAuxiliary>) => {
    useIDEStore.setState(patch)
  }, [])

  const setShowAuthModal = useIDEStore((s) => s.setShowAuthModal)
  const setRightPanelView = useIDEStore((s) => s.setRightPanelView)
  const setShowCollaboration = useIDEStore((s) => s.setShowCollaboration)
  const setShowCommandPalette = useIDEStore((s) => s.setShowCommandPalette)
  const setShowDropZone = useIDEStore((s) => s.setShowDropZone)
  const setShowImportModal = useIDEStore((s) => s.setShowImportModal)
  const setShowNewFileInput = useIDEStore((s) => s.setShowNewFileInput)
  const setShowPluginManager = useIDEStore((s) => s.setShowPluginManager)
  const setShowSettingsCenter = useIDEStore((s) => s.setShowSettingsCenter)
  const setShowShareModal = useIDEStore((s) => s.setShowShareModal)
  const setShowSnippetLibrary = useIDEStore((s) => s.setShowSnippetLibrary)
  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)
  const setShowTerminal = useIDEStore((s) => s.setShowTerminal)
  const setBottomPanelTab = useIDEStore((s) => s.setBottomPanelTab)
  const setShowWelcome = useIDEStore((s) => s.setShowWelcome)
  const setShowWorkspaceManager = useIDEStore((s) => s.setShowWorkspaceManager)
  const setShowWorkspacePanel = useIDEStore((s) => s.setShowWorkspacePanel)
  const setShowTemplateModal = useIDEStore((s) => s.setShowTemplateModal)
  const setShowSpecStudio = useIDEStore((s) => s.setShowSpecStudio)
  const setSpecStudioPrefill = useIDEStore((s) => s.setSpecStudioPrefill)
  const setShowThemeSelector = useIDEStore((s) => s.setShowThemeSelector)

  const showSearchPanel = useIDEStore((s) => s.showSearchPanel)
  const showPreview = useIDEStore((s) => s.showPreview)
  const showCodeReview = useIDEStore((s) => s.showCodeReview)
  const showPerformance = useIDEStore((s) => s.showPerformance)
  const showGitPanel = useIDEStore((s) => s.showGitPanel)

  const closeAuxiliaryPanel = useCallback(() => applyLayout(patchCloseAuxiliary()), [applyLayout])
  const closeChatPanel = useCallback(() => applyLayout({ showChatPanel: false }), [applyLayout])
  const closeCommandPalette = useCallback(() => setShowCommandPalette(false), [setShowCommandPalette])
  const closeGitPanel = useCallback(() => applyLayout({ showGitPanel: false }), [applyLayout])
  const closeSettingsPanel = useCallback(() => setShowSettingsCenter(false), [setShowSettingsCenter])
  const closeWelcomeAnd = useCallback(
    (action: () => void) => {
      setShowWelcome(false)
      action()
    },
    [setShowWelcome],
  )

  const setAuthModalTab = useIDEStore((s) => s.setAuthModalTab)
  const openAuthDialog = useCallback(() => {
    setAuthModalTab('login')
    setShowAuthModal(true)
  }, [setAuthModalTab, setShowAuthModal])

  const openRegisterDialog = useCallback(() => {
    setAuthModalTab('register')
    setShowAuthModal(true)
  }, [setAuthModalTab, setShowAuthModal])

  const openChatPanel = useCallback(() => {
    applyLayout(patchOpenChatPanel())
    setRightPanelView('chat')
  }, [applyLayout, setRightPanelView])

  const openBackgroundJobsPanel = useCallback(() => {
    applyLayout(patchOpenChatPanel())
    setRightPanelView('backgroundJobs')
  }, [applyLayout, setRightPanelView])

  const openCodeReviewPanel = useCallback(() => applyLayout(patchOpenAuxiliary('codeReview')), [applyLayout])
  const openCollaborationDialog = useCallback(() => setShowCollaboration(true), [setShowCollaboration])
  const openCommandPalette = useCallback(() => setShowCommandPalette(true), [setShowCommandPalette])
  const openDropZone = useCallback(() => setShowDropZone(true), [setShowDropZone])

  const openGitPanel = useCallback(() => applyLayout(patchOpenGitPanel()), [applyLayout])

  const openImportDialog = useCallback(() => setShowImportModal(true), [setShowImportModal])
  const openNewFileInput = useCallback(() => setShowNewFileInput(true), [setShowNewFileInput])
  const openPerformanceDialog = useCallback(() => applyLayout(patchOpenAuxiliary('performance')), [applyLayout])
  const openPluginDialog = useCallback(() => setShowPluginManager(true), [setShowPluginManager])

  const openPreviewPanel = useCallback(
    () => applyLayout(patchToggleAuxiliary('preview', { showSearchPanel, showPreview, showCodeReview, showPerformance })),
    [applyLayout, showSearchPanel, showPreview, showCodeReview, showPerformance],
  )

  const openSearchPanel = useCallback(
    () => applyLayout(patchToggleAuxiliary('search', { showSearchPanel, showPreview, showCodeReview, showPerformance })),
    [applyLayout, showSearchPanel, showPreview, showCodeReview, showPerformance],
  )

  const openSettingsPanel = useCallback(() => setShowSettingsCenter(true), [setShowSettingsCenter])
  const openShareDialog = useCallback(() => setShowShareModal(true), [setShowShareModal])
  const openSnippetPanel = useCallback(() => setShowSnippetLibrary(true), [setShowSnippetLibrary])
  const openSubscriptionDialog = useCallback(() => setShowSubscriptionModal(true), [setShowSubscriptionModal])
  const openTerminalPanel = useCallback(() => {
    setShowTerminal(true)
    setBottomPanelTab('terminal')
  }, [setBottomPanelTab, setShowTerminal])
  const openScriptsPanel = useCallback(() => {
    setShowTerminal(true)
    setBottomPanelTab('scripts')
  }, [setBottomPanelTab, setShowTerminal])
  const openTasksPanel = useCallback(() => {
    setShowTerminal(true)
    setBottomPanelTab('tasks')
  }, [setBottomPanelTab, setShowTerminal])
  const openDebugPanel = useCallback(() => {
    setShowTerminal(true)
    setBottomPanelTab('debug')
  }, [setBottomPanelTab, setShowTerminal])
  const openWorkspaceManagerModal = useCallback(() => setShowWorkspaceManager(true), [setShowWorkspaceManager])
  const openWorkspacePanelModal = useCallback(() => setShowWorkspacePanel(true), [setShowWorkspacePanel])
  const openTemplateModal = useCallback(() => setShowTemplateModal(true), [setShowTemplateModal])
  const openSpecStudio = useCallback(
    (prefill?: { specName?: string; templateId?: string }) => {
      setSpecStudioPrefill(prefill ?? null)
      setShowSpecStudio(true)
    },
    [setShowSpecStudio, setSpecStudioPrefill],
  )
  const openThemeSelector = useCallback(() => setShowThemeSelector(true), [setShowThemeSelector])
  const openWelcomeScreen = useCallback(() => setShowWelcome(true), [setShowWelcome])

  const toggleGitPanel = useCallback(() => {
    applyLayout(patchToggleGitPanel({ showGitPanel }))
  }, [applyLayout, showGitPanel])

  const toggleTerminalPanel = useCallback(() => setShowTerminal((prev) => !prev), [setShowTerminal])

  return {
    closeAuxiliaryPanel,
    closeChatPanel,
    closeCommandPalette,
    closeGitPanel,
    closeSettingsPanel,
    closeWelcomeAnd,
    openAuthDialog,
    openRegisterDialog,
    openChatPanel,
    openBackgroundJobsPanel,
    openCodeReviewPanel,
    openCollaborationDialog,
    openCommandPalette,
    openDropZone,
    openGitPanel,
    openImportDialog,
    openNewFileInput,
    openPerformanceDialog,
    openPluginDialog,
    openPreviewPanel,
    openSearchPanel,
    openSettingsPanel,
    openShareDialog,
    openSnippetPanel,
    openSubscriptionDialog,
    openTerminalPanel,
    openScriptsPanel,
    openTasksPanel,
    openDebugPanel,
    openWorkspaceManagerModal,
    openWorkspacePanelModal,
    openTemplateModal,
    openSpecStudio,
    openThemeSelector,
    openWelcomeScreen,
    toggleGitPanel,
    toggleTerminalPanel,
  }
}
