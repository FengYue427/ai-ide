import { useMemo } from 'react'
import { collectAllTaskSources, listTaskFileGroups, type TaskFileGroup } from '../lib/projectTasksNavigation'
import { workspaceContextService } from '../services/workspaceContextService'
import { useIDEStore } from '../store/ideStore'

export function useTaskFileGroups(): TaskFileGroup[] {
  const files = useIDEStore((s) => s.files)

  return useMemo(() => {
    const sources = collectAllTaskSources(
      files.map((file) => ({ name: file.name, content: file.content })),
      workspaceContextService.getAllFiles(),
    )
    return listTaskFileGroups(sources)
  }, [files])
}
