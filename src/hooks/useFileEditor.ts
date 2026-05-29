import { useDebounce } from './useDebounce'
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
}

export function useFileEditor({ activeFile, setFiles }: UseFileEditorOptions) {
  const collaborationRoomId = useIDEStore((s) => s.collaborationRoomId)
  const collaborationMemberRole = useIDEStore((s) => s.collaborationMemberRole)
  const collabCanWrite = collabRoleCanWrite(collaborationMemberRole)

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
      void syncToLocalDisk(fileName, content)
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

  return {
    handleFileChange,
  }
}
