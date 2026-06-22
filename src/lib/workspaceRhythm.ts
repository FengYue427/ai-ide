/**
 * Activity Line rhythm stage derived from runtime + spec state.
 */
import type { FileItem } from '../types/file'
import { buildSpecStatusSummary } from './specStatusSummary'
import { buildRuntimeStatePreview } from '../services/runtime/runtimeStatePreview'

export type WorkspaceRhythmStage = 'idle' | 'planning' | 'executing' | 'verify' | 'failed' | 'review'

export interface WorkspaceRhythm {
  stage: WorkspaceRhythmStage
  activeSpecSlug: string | null
  openTaskCount: number
}

export function buildWorkspaceRhythm(
  files: FileItem[],
  flags: {
    failedSpecExecution?: boolean
    verifyingSpecBackfill?: boolean
    queuedSpecBackfill?: boolean
    workspaceMode?: string
  },
): WorkspaceRhythm {
  const spec = buildSpecStatusSummary(files)
  const runtime = buildRuntimeStatePreview(files)

  let stage: WorkspaceRhythmStage = 'idle'
  if (flags.failedSpecExecution) {
    stage = 'failed'
  } else if (flags.verifyingSpecBackfill) {
    stage = 'verify'
  } else if (flags.queuedSpecBackfill) {
    stage = 'executing'
  } else if (flags.workspaceMode === 'plan') {
    stage = 'planning'
  } else if (flags.workspaceMode === 'review') {
    stage = 'review'
  } else if (spec.openTaskCount > 0 && runtime.activeSpecPath) {
    stage = 'executing'
  } else if (spec.specCount > 0 && spec.openTaskCount === 0) {
    stage = 'review'
  }

  return {
    stage,
    activeSpecSlug: spec.activeSpecSlug,
    openTaskCount: spec.openTaskCount,
  }
}
