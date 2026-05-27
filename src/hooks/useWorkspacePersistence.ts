import { useEffect } from 'react'
import { createTranslator, type Language } from '../i18n'
import { authService, type User as AuthUser } from '../services/authService'
import { cloudSyncService } from '../services/cloudSyncService'
import { recentFilesService } from '../services/recentFilesService'
import { isWorkspaceHydrated } from '../services/workspaceSession'
import { unifiedStorage, StorageLayer } from '../services/unifiedStorage'
import type { FileItem } from '../types/file'

interface UseWorkspacePersistenceOptions {
  autoSaveEnabled: boolean
  currentUser: AuthUser | null
  files: FileItem[]
  uiLocale: Language
  theme: 'vs-dark' | 'light'
  showWelcome: boolean
}

export function useWorkspacePersistence({
  autoSaveEnabled,
  currentUser,
  files,
  uiLocale,
  theme,
  showWelcome,
}: UseWorkspacePersistenceOptions) {
  useEffect(() => {
    const t = createTranslator(uiLocale)
    if (!autoSaveEnabled) return
    // Welcome screen keeps the starter template in memory — do not overwrite real autosave.
    if (showWelcome) return
    if (!isWorkspaceHydrated()) return

    const timer = setTimeout(async () => {
      const ideFiles = files.map((file, index) => ({
        id: index.toString(),
        name: file.name,
        content: file.content,
        language: file.language,
        lastModified: Date.now(),
      }))

      await unifiedStorage.set('autosave-default', ideFiles, { layer: StorageLayer.INDEXED })

      await cloudSyncService.autoBackup(
        ideFiles.map(({ name, content, language }) => ({ name, content, language })),
        { theme, autoSave: autoSaveEnabled, language: uiLocale },
      )

      const projectName =
        files.length === 1 ? files[0].name : t('notify.autosaveProjectName', { count: files.length })
      await recentFilesService.addRecentProject({
        id: 'autosave-default',
        name: projectName,
        fileCount: files.length,
        workspaceId: 'autosave-default',
      })

      if (currentUser) {
        authService.saveWorkspace(ideFiles, { theme }, 'default')
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [autoSaveEnabled, currentUser, files, theme, uiLocale, showWelcome])
}
