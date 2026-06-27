import { useDebounce } from './useDebounce'
import { useRef } from 'react'
import { collabRoleCanWrite } from '../lib/collabPermissions'
import { collaborationService } from '../services/collaborationService'
import { projectIndexManager } from '../services/projectIndexManager'
import { detectLanguageFromPath } from '../services/projectIndexService'
import { workspaceContextService } from '../services/workspaceContextService'
import { syncToLocalDisk } from '../services/localProjectSync'
import { useIDEStore } from '../store/ideStore'
import type { FileItem } from '../types/file'

interface UseFileEditorOptions {
  activeFile: number
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
  onLocalSyncFailed?: (path: string, detail: string) => void
}

export function useFileEditor({ activeFile, setFiles, onLocalSyncFailed }: UseFileEditorOptions) {
  const collaborationRoomId = useIDEStore((s) => s.collaborationRoomId)
  const collaborationMemberRole = useIDEStore((s) => s.collaborationMemberRole)
  const collabCanWrite = collabRoleCanWrite(collaborationMemberRole)
  const lastSyncFailureRef = useRef<{ path: string; at: number } | null>(null)

  const debouncedFileChange = useDebounce((index: number, content: string | undefined, fileName?: string) => {
    if (content === undefined) return

    setFiles((prevFiles) => {
      const nextFiles = [...prevFiles]
      nextFiles[index] = { ...nextFiles[index], content }
      return nextFiles
    })

    if (collaborationRoomId && collabCanWrite && fileName) {
      collaborationService.syncFile(fileName, content)
    }

    if (fileName && workspaceContextService.getFile(fileName)) {
      void workspaceContextService.updateFile(fileName, content)
      void syncToLocalDisk(fileName, content).then((result) => {
        if (result.ok || !onLocalSyncFailed) return
        const now = Date.now()
        const last = lastSyncFailureRef.current
        if (last?.path === fileName && now - last.at < 5000) return
        lastSyncFailureRef.current = { path: fileName, at: now }
        onLocalSyncFailed(fileName, result.error)
      })
      projectIndexManager.patchFile({
        path: fileName,
        content,
        language: detectLanguageFromPath(fileName),
      })
    }
  }, 150)

  const handleFileChange = (content: string | undefined) => {
    if (content === undefined) return
    const fileName = useIDEStore.getState().files[activeFile]?.name
    debouncedFileChange(activeFile, content, fileName)
  }

  return { handleFileChange }
}
