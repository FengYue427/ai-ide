import { useEffect, useRef } from 'react'
import { modelOptions } from '../services/aiService'
import { authService } from '../services/authService'
import { recentFilesService } from '../services/recentFilesService'
import { loadShareById } from '../services/shareService'
import { loadLocalAutosaveFiles } from '../services/workspaceAutosave'
import { loadWorkspaceRootsForBootstrap } from '../services/workspaceRootsService'
import { markWorkspaceHydrated, pickRicherFileSet } from '../services/workspaceSession'
import { useIDEStore, exposeIDEStoreForE2E } from '../store/ideStore'
import { isMultiRootWorkspaceEnabled } from '../lib/v12Features'
import { unifiedStorage } from '../services/unifiedStorage'
import { loadBottomPanelPrefs } from '../services/bottomPanelPrefsService'
import type { FileItem } from '../types/file'
import {
  DESKTOP_SHELL_RETURN_PARAM,
  markDesktopShellReturn,
  returnToLocalDesktopShell,
  shouldReturnToDesktopShell,
} from '../lib/externalNavigation'
import { isDesktopApp } from '../services/desktopBridge'
import { markDesktopReturnPending, triggerDesktopReturnFromBrowser } from '../lib/desktopDeepLink'

function isE2EHarnessActive(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem('ai-ide:e2e-harness') === '1'
}

function loadE2EAutosaveSeed(): FileItem[] | null {
  if (!isE2EHarnessActive()) return null
  try {
    const raw = localStorage.getItem('ai-ide:e2e-autosave')
    if (!raw) return null
    const parsed = JSON.parse(raw) as Array<{ name: string; content: string; language?: string }>
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return parsed.map((file) => ({
      name: file.name,
      content: file.content,
      language: file.language || 'plaintext',
    }))
  } catch {
    return null
  }
}

export function useAppBootstrap() {
  const authChecked = useIDEStore((s) => s.authChecked)
  const currentUser = useIDEStore((s) => s.currentUser)
  const initialWorkspaceLoadedRef = useRef(false)

  useEffect(() => {
    exposeIDEStoreForE2E()
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      const [savedTheme, savedSettings, savedAIConfig, bottomPanelPrefs] = await Promise.all([
        unifiedStorage.get<'vs-dark' | 'light'>('theme', 'vs-dark'),
        unifiedStorage.get<{ autosave: boolean; formatOnSave?: boolean }>('settings', {
          autosave: true,
          formatOnSave: false,
        }),
        unifiedStorage.get('ai-config', useIDEStore.getState().aiConfig),
        loadBottomPanelPrefs(),
      ])

      const {
        setTheme,
        setAutoSaveEnabled,
        setFormatOnSaveEnabled,
        setAiConfig,
        setBottomPanelTab,
        setBottomPanelHeight,
      } = useIDEStore.getState()
      setTheme(savedTheme)
      setAutoSaveEnabled(savedSettings.autosave)
      setFormatOnSaveEnabled(savedSettings.formatOnSave ?? false)
      setBottomPanelTab(bottomPanelPrefs.tab)
      setBottomPanelHeight(bottomPanelPrefs.height)

      const validModels = modelOptions[savedAIConfig.provider].models
      const model = validModels.includes(savedAIConfig.model) ? savedAIConfig.model : validModels[0]
      setAiConfig({
        ...savedAIConfig,
        model,
        keyMode: savedAIConfig.keyMode === 'byok' ? 'byok' : 'platform',
      })
    }

    loadSettings()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareId = params.get('share')
    const roomId = params.get('room')
    const { setFiles, setShowCollaboration } = useIDEStore.getState()

    if (shareId && params.get('view') !== 'progress') {
      void loadShareById(shareId).then((shareData) => {
        if (shareData) {
          setFiles(shareData.files)
          markWorkspaceHydrated()
        }
        window.history.replaceState({}, '', window.location.pathname)
      })
    }

    if (roomId) {
      setShowCollaboration(true)
    }

    const authView = params.get('auth')
    if (authView === 'register' || authView === 'login') {
      const { setShowAuthModal, setAuthModalTab } = useIDEStore.getState()
      setAuthModalTab(authView)
      setShowAuthModal(true)
      params.delete('auth')
      const next = params.toString()
      const path = window.location.pathname
      window.history.replaceState({}, '', next ? `${path}?${next}` : path)
    }
  }, [])

  useEffect(() => {
    const { setCurrentUser, setAuthChecked } = useIDEStore.getState()
    const params = new URLSearchParams(window.location.search)
    const needsOAuthSync = params.get('oauth_sync') === '1'

    const finishAuth = async () => {
      const returnToDesktopShell = shouldReturnToDesktopShell(params)
      if (needsOAuthSync) {
        const synced = await authService.syncOAuthSession()
        if (synced.user) {
          setCurrentUser(synced.user)
        } else {
          const session = await authService.getSession()
          setCurrentUser(session?.user || null)
        }
        params.delete('oauth_sync')
        params.delete(DESKTOP_SHELL_RETURN_PARAM)
        const query = params.toString()
        window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`)

        if (returnToDesktopShell && useIDEStore.getState().currentUser) {
          if (isDesktopApp()) {
            markDesktopShellReturn('oauth')
            const reloaded = await returnToLocalDesktopShell()
            if (reloaded) return
          } else {
            markDesktopReturnPending('oauth')
            triggerDesktopReturnFromBrowser('oauth', { token: synced.token })
          }
        }
      } else {
        const session = await authService.getSession()
        setCurrentUser(session?.user || null)
      }
      setAuthChecked(true)
      if (useIDEStore.getState().currentUser) {
        const { syncBillingFromServer } = await import('../services/billingSync')
        await syncBillingFromServer()
      }
    }

    void finishAuth()
  }, [])

  useEffect(() => {
    if (!authChecked) return
    if (initialWorkspaceLoadedRef.current) return
    initialWorkspaceLoadedRef.current = true

    const loadWorkspace = async () => {
      const { setShowWelcome, setFiles, setWorkspaceRootsState } = useIDEStore.getState()

      if (isE2EHarnessActive()) {
        const e2eSeed = loadE2EAutosaveSeed()
        const localFiles = await loadLocalAutosaveFiles()
        const fallback =
          pickRicherFileSet(localFiles, null) ??
          (e2eSeed && e2eSeed.length > 0 ? e2eSeed : useIDEStore.getState().files)

        if (isMultiRootWorkspaceEnabled()) {
          const { roots, activeRootId } = await loadWorkspaceRootsForBootstrap(fallback)
          const active = roots.find((root) => root.id === activeRootId) ?? roots[0]
          const activeFiles =
            active.files.length > 0 ? active.files : fallback.length > 0 ? fallback : null
          if (activeFiles && activeFiles.length > 0) {
            setWorkspaceRootsState(roots, activeRootId, activeFiles)
          } else if (fallback.length > 0) {
            setWorkspaceRootsState(roots, activeRootId, fallback)
          }
        } else if (fallback.length > 0) {
          setFiles(fallback)
        }

        setShowWelcome(false)
        markWorkspaceHydrated()
        return
      }

      const localFiles = await loadLocalAutosaveFiles()
      let cloudFiles: FileItem[] | null = null

      if (currentUser) {
        const cloudData = await authService.loadWorkspace('default')
        if (cloudData?.files?.length) {
          cloudFiles = cloudData.files.map((file) => ({
            name: file.name,
            content: file.content,
            language: file.language || 'plaintext',
          }))
        }
      }

      const best = pickRicherFileSet(localFiles, cloudFiles)
      if (isMultiRootWorkspaceEnabled()) {
        const fallback = best && best.length > 0 ? best : useIDEStore.getState().files
        const { roots, activeRootId } = await loadWorkspaceRootsForBootstrap(fallback)
        const active = roots.find((root) => root.id === activeRootId) ?? roots[0]
        const activeFiles =
          active.files.length > 0 ? active.files : best && best.length > 0 ? best : null
        if (activeFiles && activeFiles.length > 0) {
          setWorkspaceRootsState(roots, activeRootId, activeFiles)
          markWorkspaceHydrated()
          return
        }
        setShowWelcome(true)
        return
      }

      if (best && best.length > 0) {
        setFiles(best)
        markWorkspaceHydrated()
        return
      }

      setShowWelcome(true)
    }

    void loadWorkspace()
  }, [authChecked, currentUser])

  useEffect(() => {
    recentFilesService.getRecentProjects().then(useIDEStore.getState().setRecentProjects)
  }, [])
}
