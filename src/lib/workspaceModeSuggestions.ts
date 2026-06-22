/**
 * Phase 5.2 — infer suggested workspace mode from context.
 */
import type { WorkspaceMode } from './workspaceMode'

export interface WorkspaceModeSuggestionInput {
  activeFileName: string | null
  workspaceMode: WorkspaceMode
  queueActive: boolean
  openTaskCount: number
  gitModifiedCount: number
  planFileOpen: boolean
}

export function inferSuggestedWorkspaceMode(input: WorkspaceModeSuggestionInput): WorkspaceMode | null {
  if (input.queueActive && input.workspaceMode !== 'execute') return 'execute'
  if (input.planFileOpen && input.workspaceMode !== 'plan') return 'plan'
  if (input.gitModifiedCount > 0 && input.openTaskCount === 0 && input.workspaceMode !== 'review') {
    return 'review'
  }
  if (
    input.openTaskCount > 0 &&
    !input.queueActive &&
    input.workspaceMode !== 'execute' &&
    !input.planFileOpen
  ) {
    return 'execute'
  }
  const name = input.activeFileName?.replace(/\\/g, '/') ?? ''
  if (/\/\.aide\/plans\/.+\.md$/i.test(name) && input.workspaceMode !== 'plan') return 'plan'
  if (/\/acceptance\.md$/i.test(name) && input.workspaceMode !== 'review') return 'review'
  return null
}

export function isPlanFilePath(path: string | null | undefined): boolean {
  if (!path) return false
  return /\.aide\/plans\/.+\.md$/i.test(path.replace(/\\/g, '/'))
}
