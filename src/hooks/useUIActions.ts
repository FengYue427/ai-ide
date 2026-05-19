import { useCallback } from 'react'
import { useIDEStore } from '../store/ideStore'

export function useUIActions() {
  const setShowAuthModal = useIDEStore((s) => s.setShowAuthModal)
  const setShowChatPanel = useIDEStore((s) => s.setShowChatPanel)
  const setShowCodeReview = useIDEStore((s) => s.setShowCodeReview)
  const setShowCollaboration = useIDEStore((s) => s.setShowCollaboration)
  const setShowCommandPalette = useIDEStore((s) => s.setShowCommandPalette)
  const setShowDropZone = useIDEStore((s) => s.setShowDropZone)
  const setShowGitPanel = useIDEStore((s) => s.setShowGitPanel)
  const setShowImportModal = useIDEStore((s) => s.setShowImportModal)
  const setShowNewFileInput = useIDEStore((s) => s.setShowNewFileInput)
  const setShowPerformance = useIDEStore((s) => s.setShowPerformance)
  const setShowPluginManager = useIDEStore((s) => s.setShowPluginManager)
  const setShowPreview = useIDEStore((s) => s.setShowPreview)
  const setShowSearchPanel = useIDEStore((s) => s.setShowSearchPanel)
  const setShowSettingsCenter = useIDEStore((s) => s.setShowSettingsCenter)
  const setShowShareModal = useIDEStore((s) => s.setShowShareModal)
  const setShowSnippetLibrary = useIDEStore((s) => s.setShowSnippetLibrary)
  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)
  const setShowTerminal = useIDEStore((s) => s.setShowTerminal)
  const setShowWelcome = useIDEStore((s) => s.setShowWelcome)
  const setShowWorkspaceManager = useIDEStore((s) => s.setShowWorkspaceManager)
  const setShowWorkspacePanel = useIDEStore((s) => s.setShowWorkspacePanel)
  const setShowTemplateModal = useIDEStore((s) => s.setShowTemplateModal)
  const setShowThemeSelector = useIDEStore((s) => s.setShowThemeSelector)

  const closeChatPanel = useCallback(() => setShowChatPanel(false), [setShowChatPanel])
  const closeCommandPalette = useCallback(() => setShowCommandPalette(false), [setShowCommandPalette])
  const closeGitPanel = useCallback(() => setShowGitPanel(false), [setShowGitPanel])
  const closeSettingsPanel = useCallback(() => setShowSettingsCenter(false), [setShowSettingsCenter])
  const closeWelcomeAnd = useCallback(
    (action: () => void) => {
      setShowWelcome(false)
      action()
    },
    [setShowWelcome],
  )

  const openAuthDialog = useCallback(() => setShowAuthModal(true), [setShowAuthModal])
  const openChatPanel = useCallback(() => {
    setShowGitPanel(false)
    setShowChatPanel(true)
  }, [setShowChatPanel, setShowGitPanel])
  const openCodeReviewPanel = useCallback(() => setShowCodeReview(true), [setShowCodeReview])
  const openCollaborationDialog = useCallback(() => setShowCollaboration(true), [setShowCollaboration])
  const openCommandPalette = useCallback(() => setShowCommandPalette(true), [setShowCommandPalette])
  const openDropZone = useCallback(() => setShowDropZone(true), [setShowDropZone])
  const openGitPanel = useCallback(() => {
    setShowChatPanel(false)
    setShowGitPanel(true)
  }, [setShowChatPanel, setShowGitPanel])
  const openImportDialog = useCallback(() => setShowImportModal(true), [setShowImportModal])
  const openNewFileInput = useCallback(() => setShowNewFileInput(true), [setShowNewFileInput])
  const openPerformanceDialog = useCallback(() => setShowPerformance(true), [setShowPerformance])
  const openPluginDialog = useCallback(() => setShowPluginManager(true), [setShowPluginManager])
  const openPreviewPanel = useCallback(() => setShowPreview(true), [setShowPreview])
  const openSearchPanel = useCallback(() => setShowSearchPanel(true), [setShowSearchPanel])
  const openSettingsPanel = useCallback(() => setShowSettingsCenter(true), [setShowSettingsCenter])
  const openShareDialog = useCallback(() => setShowShareModal(true), [setShowShareModal])
  const openSnippetPanel = useCallback(() => setShowSnippetLibrary(true), [setShowSnippetLibrary])
  const openSubscriptionDialog = useCallback(() => setShowSubscriptionModal(true), [setShowSubscriptionModal])
  const openTerminalPanel = useCallback(() => setShowTerminal(true), [setShowTerminal])
  const openWorkspaceManagerModal = useCallback(() => setShowWorkspaceManager(true), [setShowWorkspaceManager])
  const openWorkspacePanelModal = useCallback(() => setShowWorkspacePanel(true), [setShowWorkspacePanel])
  const openTemplateModal = useCallback(() => setShowTemplateModal(true), [setShowTemplateModal])
  const openThemeSelector = useCallback(() => setShowThemeSelector(true), [setShowThemeSelector])
  const openWelcomeScreen = useCallback(() => setShowWelcome(true), [setShowWelcome])
  const toggleGitPanel = useCallback(() => {
    setShowGitPanel((prev) => {
      if (!prev) setShowChatPanel(false)
      return !prev
    })
  }, [setShowChatPanel, setShowGitPanel])
  const toggleTerminalPanel = useCallback(() => setShowTerminal((prev) => !prev), [setShowTerminal])

  return {
    closeChatPanel,
    closeCommandPalette,
    closeGitPanel,
    closeSettingsPanel,
    closeWelcomeAnd,
    openAuthDialog,
    openChatPanel,
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
    openWorkspaceManagerModal,
    openWorkspacePanelModal,
    openTemplateModal,
    openThemeSelector,
    openWelcomeScreen,
    toggleGitPanel,
    toggleTerminalPanel,
  }
}
