import { useEffect } from 'react'
import { authService, type User as AuthUser } from '../services/authService'
import { cloudSyncService } from '../services/cloudSyncService'
import { recentFilesService } from '../services/recentFilesService'
import { unifiedStorage, StorageLayer } from '../services/unifiedStorage'
import type { FileItem } from '../types/file'

interface UseWorkspacePersistenceOptions {
  autoSaveEnabled: boolean
  currentUser: AuthUser | null
  files: FileItem[]
  language: string
  theme: 'vs-dark' | 'light'
}

export function useWorkspacePersistence({
  autoSaveEnabled,
  currentUser,
  files,
  language,
  theme,
}: UseWorkspacePersistenceOptions) {
  useEffect(() => {
    if (!autoSaveEnabled) return

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
        { theme, autoSave: autoSaveEnabled, language },
      )

      const projectName =
        files.length === 1 ? files[0].name : `工作区（${files.length} 个文件）`
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
  }, [autoSaveEnabled, currentUser, files, theme])
}
