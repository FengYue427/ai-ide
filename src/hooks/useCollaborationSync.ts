import { useEffect, useRef } from 'react'
import { getLanguageFromExt } from '../app/getLanguageFromExt'
import { collabRoleCanWrite } from '../lib/collabPermissions'
import { collaborationService } from '../services/collaborationService'
import { useIDEStore } from '../store/ideStore'
import type { FileItem } from '../types/file'

function mergeRemoteSnapshot(prev: FileItem[], snapshot: Record<string, string>): FileItem[] {
  const paths = Object.keys(snapshot)
  if (paths.length === 0) return prev

  const merged = [...prev]
  let changed = false

  for (const path of paths) {
    const content = snapshot[path]
    const index = merged.findIndex((file) => file.name === path)
    if (index >= 0) {
      if (merged[index].content !== content) {
        merged[index] = { ...merged[index], content }
        changed = true
      }
    } else {
      merged.push({
        name: path,
        content,
        language: getLanguageFromExt(path),
      })
      changed = true
    }
  }

  return changed ? merged : prev
}

/** Sync editor files with Yjs when collaborationRoomId is set. */
export function useCollaborationSync() {
  const collaborationRoomId = useIDEStore((s) => s.collaborationRoomId)
  const collaborationMemberRole = useIDEStore((s) => s.collaborationMemberRole)
  const files = useIDEStore((s) => s.files)
  const setFiles = useIDEStore((s) => s.setFiles)
  const skipLocalSync = useRef(false)
  const canWrite = collabRoleCanWrite(collaborationMemberRole)

  useEffect(() => {
    if (!collaborationRoomId) return

    const currentFiles = useIDEStore.getState().files
    if (canWrite) {
      collaborationService.pushWorkspaceFiles(
        currentFiles.map((file) => ({ name: file.name, content: file.content })),
      )
    }

    const unsubscribe = collaborationService.onWorkspaceFilesChange((snapshot) => {
      skipLocalSync.current = true
      setFiles((prev) => mergeRemoteSnapshot(prev, snapshot))
      queueMicrotask(() => {
        skipLocalSync.current = false
      })
    })

    return unsubscribe
  }, [collaborationRoomId, canWrite, setFiles])

  useEffect(() => {
    if (!collaborationRoomId || skipLocalSync.current || !canWrite) return

    for (const file of files) {
      collaborationService.syncFile(file.name, file.content)
    }
  }, [files, collaborationRoomId, canWrite])
}
