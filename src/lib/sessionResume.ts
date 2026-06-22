/**
 * Session resume snapshot — "continue where you left off".
 */
import type { FileItem } from '../types/file'
import { buildSpecStatusSummary } from './specStatusSummary'
import { buildRuntimeStatePreview } from '../services/runtime/runtimeStatePreview'
import type { WorkspaceMode } from './workspaceMode'

export const SESSION_RESUME_STORAGE_KEY = 'aide:session-resume'
export const SESSION_RESUME_DISMISS_KEY = 'aide:session-resume-dismissed'

export interface SessionResumeSnapshot {
  savedAt: string
  activeFileName: string | null
  activeSpecPath: string | null
  activeSpecSlug: string | null
  openTaskCount: number
  workspaceMode: WorkspaceMode
  specCount: number
}

export function buildSessionResumeSnapshot(input: {
  files: FileItem[]
  activeFileIndex: number
  workspaceMode: WorkspaceMode
}): SessionResumeSnapshot {
  const activeFile = input.files[input.activeFileIndex]
  const spec = buildSpecStatusSummary(input.files)
  const runtime = buildRuntimeStatePreview(input.files)
  const activeSpecPath = runtime.activeSpecPath ?? spec.runnableTasksPath

  return {
    savedAt: new Date().toISOString(),
    activeFileName: activeFile?.name ?? null,
    activeSpecPath,
    activeSpecSlug: spec.activeSpecSlug,
    openTaskCount: spec.openTaskCount,
    workspaceMode: input.workspaceMode,
    specCount: spec.specCount,
  }
}

export function persistSessionResume(snapshot: SessionResumeSnapshot): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SESSION_RESUME_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // ignore
  }
}

export function loadSessionResume(): SessionResumeSnapshot | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_RESUME_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionResumeSnapshot
    if (!parsed?.savedAt) return null
    return parsed
  } catch {
    return null
  }
}

export function isSessionResumeStale(snapshot: SessionResumeSnapshot, maxAgeMs = 7 * 24 * 60 * 60 * 1000): boolean {
  const at = new Date(snapshot.savedAt).getTime()
  if (Number.isNaN(at)) return true
  return Date.now() - at > maxAgeMs
}

export function dismissSessionResumeBar(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(SESSION_RESUME_DISMISS_KEY, '1')
}

export function isSessionResumeBarDismissed(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(SESSION_RESUME_DISMISS_KEY) === '1'
}

export function clearSessionResumeDismiss(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(SESSION_RESUME_DISMISS_KEY)
}
