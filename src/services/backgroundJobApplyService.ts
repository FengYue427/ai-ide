import type { SerializedBackgroundJob } from './backgroundJobsApiService'
import type { FileItem } from '../types/file'
import { getOldContentForPath } from './fileApplyService'
import { detectLanguageFromPath } from './projectIndexService'
import type { AgentApplyItem } from '../store/ideStore'

export function getJobPendingFileChanges(
  job: SerializedBackgroundJob,
): Array<{ path: string; content: string; language: string }> {
  const raw = job.result?.pendingChanges ?? []
  return raw
    .filter((c): c is { path: string; content: string; language?: string } =>
      Boolean(c.path && typeof c.content === 'string'),
    )
    .map((c) => ({
      path: c.path.replace(/\\/g, '/').replace(/^\/+/, ''),
      content: c.content,
      language: c.language ?? detectLanguageFromPath(c.path),
    }))
}

export function buildAgentApplyQueueFromJob(
  job: SerializedBackgroundJob,
  editorFiles: FileItem[],
): AgentApplyItem[] {
  return getJobPendingFileChanges(job).map((change) => ({
    path: change.path,
    oldContent: getOldContentForPath(editorFiles, change.path),
    newContent: change.content,
    language: change.language,
  }))
}

export function mergeJobChangesIntoFileItems(
  files: FileItem[],
  job: SerializedBackgroundJob,
): FileItem[] {
  const changes = getJobPendingFileChanges(job)
  if (changes.length === 0) return files

  const map = new Map<string, FileItem>()
  for (const file of files) {
    map.set(file.name.replace(/\\/g, '/'), file)
  }

  for (const change of changes) {
    const existing = map.get(change.path)
    if (existing) {
      map.set(change.path, {
        ...existing,
        name: change.path,
        content: change.content,
        language: change.language,
      })
    } else {
      map.set(change.path, {
        name: change.path,
        content: change.content,
        language: change.language,
      })
    }
  }

  return [...map.values()]
}

export function applyBackgroundJobToIde(
  files: FileItem[],
  job: SerializedBackgroundJob,
): { files: FileItem[]; appliedCount: number } {
  const changes = getJobPendingFileChanges(job)
  if (changes.length === 0) return { files, appliedCount: 0 }
  return { files: mergeJobChangesIntoFileItems(files, job), appliedCount: changes.length }
}
