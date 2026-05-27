import { useEffect, useRef } from 'react'
import { modelOptions } from '../services/aiService'
import { authService } from '../services/authService'
import { recentFilesService } from '../services/recentFilesService'
import { getShare } from '../services/shareService'
import { loadLocalAutosaveFiles } from '../services/workspaceAutosave'
import { markWorkspaceHydrated, pickRicherFileSet } from '../services/workspaceSession'
import { useIDEStore } from '../store/ideStore'
import { unifiedStorage } from '../services/unifiedStorage'
import type { FileItem } from '../types/file'

export function useAppBootstrap() {
  const authChecked = useIDEStore((s) => s.authChecked)
  const currentUser = useIDEStore((s) => s.currentUser)
  const initialWorkspaceLoadedRef = useRef(false)

  useEffect(() => {
    const loadSettings = async () => {
      const [savedTheme, savedSettings, savedAIConfig] = await Promise.all([
        unifiedStorage.get<'vs-dark' | 'light'>('theme', 'vs-dark'),
        unifiedStorage.get<{ autosave: boolean }>('settings', { autosave: true }),
        unifiedStorage.get('ai-config', useIDEStore.getState().aiConfig),
      ])

      const { setTheme, setAutoSaveEnabled, setAiConfig } = useIDEStore.getState()
      setTheme(savedTheme)
      setAutoSaveEnabled(savedSettings.autosave)

      const validModels = modelOptions[savedAIConfig.provider].models
      const model = validModels.includes(savedAIConfig.model) ? savedAIConfig.model : validModels[0]
      setAiConfig({ ...savedAIConfig, model })
    }

    loadSettings()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareId = params.get('share')
    const roomId = params.get('room')
    const { setFiles, setShowCollaboration } = useIDEStore.getState()

    if (shareId) {
      const shareData = getShare(shareId)
      if (shareData) {
        setFiles(shareData.files)
        markWorkspaceHydrated()
      }
      window.history.replaceState({}, '', window.location.pathname)
    }

    if (roomId) {
      setShowCollaboration(true)
    }
  }, [])

  useEffect(() => {
    const { setCurrentUser, setAuthChecked } = useIDEStore.getState()
    const params = new URLSearchParams(window.location.search)
    const needsOAuthSync = params.get('oauth_sync') === '1'

    const finishAuth = async () => {
      if (needsOAuthSync) {
        const synced = await authService.syncOAuthSession()
        if (synced.user) {
          setCurrentUser(synced.user)
        } else {
          const session = await authService.getSession()
          setCurrentUser(session?.user || null)
        }
        params.delete('oauth_sync')
        const query = params.toString()
        window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
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

    const referrer = document.referrer
    const isFromLandingPage =
      referrer.includes('/website/') ||
      referrer.endsWith('index.html') ||
      (!referrer.includes('ai-ide') && referrer.length > 0)

    const loadWorkspace = async () => {
      const { setShowWelcome, setFiles } = useIDEStore.getState()

      if (isFromLandingPage) {
        setShowWelcome(true)
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
