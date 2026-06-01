import { useEffect, useRef } from 'react'
import { createTranslator, type Language } from '../i18n'
import { canFormatFile, formatFileContent, isEditorWritableForFormat } from '../lib/editorFormat'
import { workspaceCloudSaveToast } from '../lib/workspaceCloudSaveMessages'
import type { ToastKind } from '../components/FeedbackCenter'
import { authService, type User as AuthUser } from '../services/authService'
import { cloudSyncService } from '../services/cloudSyncService'
import { recentFilesService } from '../services/recentFilesService'
import { isWorkspaceHydrated } from '../services/workspaceSession'
import { unifiedStorage, StorageLayer } from '../services/unifiedStorage'
import { selectActiveAutosaveKey, useIDEStore } from '../store/ideStore'
import type { FileItem } from '../types/file'

interface UseWorkspacePersistenceOptions {
  autoSaveEnabled: boolean
  formatOnSaveEnabled: boolean
  activeFile: number
  collaborationRoomId: string | null
  collaborationMemberRole: string | null
  currentUser: AuthUser | null
  files: FileItem[]
  uiLocale: Language
  theme: 'vs-dark' | 'light'
  showWelcome: boolean
  notify?: (kind: ToastKind, title: string, detail?: string) => void
}

export function useWorkspacePersistence({
  autoSaveEnabled,
  formatOnSaveEnabled,
  activeFile,
  collaborationRoomId,
  collaborationMemberRole,
  currentUser,
  files,
  uiLocale,
  theme,
  showWelcome,
  notify,
}: UseWorkspacePersistenceOptions) {
  const lastCloudToastRef = useRef(0)

  useEffect(() => {
    const t = createTranslator(uiLocale)
    if (!autoSaveEnabled) return
    // Welcome screen keeps the starter template in memory — do not overwrite real autosave.
    if (showWelcome) return
    if (!isWorkspaceHydrated()) return

    const timer = setTimeout(async () => {
      let filesToSave = files

      if (
        formatOnSaveEnabled &&
        isEditorWritableForFormat({ collaborationRoomId, collaborationMemberRole })
      ) {
        const file = files[activeFile]
        if (file && canFormatFile(file)) {
          const formatted = await formatFileContent(file.content, file.language)
          if (formatted !== file.content) {
            filesToSave = files.map((entry, index) =>
              index === activeFile ? { ...entry, content: formatted } : entry,
            )
            useIDEStore.getState().setFiles(filesToSave)
          }
        }
      }

      const ideFiles = filesToSave.map((file, index) => ({
        id: index.toString(),
        name: file.name,
        content: file.content,
        language: file.language,
        lastModified: Date.now(),
      }))

      const autosaveKey = selectActiveAutosaveKey(useIDEStore.getState())
      await unifiedStorage.set(autosaveKey, ideFiles, { layer: StorageLayer.INDEXED })

      await cloudSyncService.autoBackup(
        ideFiles.map(({ name, content, language }) => ({ name, content, language })),
        { theme, autoSave: autoSaveEnabled, language: uiLocale },
      )

      const projectName =
        files.length === 1 ? files[0].name : t('notify.autosaveProjectName', { count: files.length })
      const store = useIDEStore.getState()
      const activeRoot = store.workspaceRoots.find((root) => root.id === store.activeRootId)
      await recentFilesService.addRecentProject({
        id: autosaveKey,
        name: activeRoot?.name ? `${activeRoot.name} · ${projectName}` : projectName,
        fileCount: files.length,
        workspaceId: autosaveKey,
      })

      if (currentUser) {
        const saveResult = await authService.saveWorkspace(ideFiles, { theme }, 'default')
        const toast = workspaceCloudSaveToast(saveResult, t)
        if (toast && notify) {
          const now = Date.now()
          if (now - lastCloudToastRef.current > 60_000) {
            lastCloudToastRef.current = now
            notify(toast.kind, toast.title, toast.detail)
          }
        }
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [
    activeFile,
    autoSaveEnabled,
    collaborationMemberRole,
    collaborationRoomId,
    currentUser,
    files,
    formatOnSaveEnabled,
    theme,
    uiLocale,
    showWelcome,
    notify,
  ])
}
