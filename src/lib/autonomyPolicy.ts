import type { LinkageReason, LinkageReasonId } from './linkageReason'

export type AutonomyMode = 'foreground' | 'background' | 'pause' | 'hint-only'

export interface AutonomyPolicyInput {
  tasksPath: string | null
  openTaskCount: number
  gitModifiedCount: number
  queueBusy: boolean
  groundingBlocked: boolean
  backgroundAgentEnabled: boolean
  quotaBlocked: boolean
  driftWarn?: boolean
  goalDrive?: boolean
  specCreated?: boolean
}

export interface AutonomyPolicyResult {
  mode: AutonomyMode
  reasons: LinkageReason[]
}

function push(reasons: LinkageReason[], id: LinkageReasonId, detail?: string): void {
  reasons.push(detail ? { id, detail } : { id })
}

/** Phase 10 F3 v0 — unified decision for E1/E2/E3 with causal chain. */
export function evaluateAutonomyPolicy(input: AutonomyPolicyInput): AutonomyPolicyResult {
  const reasons: LinkageReason[] = []

  if (input.quotaBlocked) {
    push(reasons, 'quota-blocked')
    return { mode: 'pause', reasons }
  }

  if (!input.tasksPath || input.openTaskCount <= 0) {
    push(reasons, 'no-open-tasks')
    return { mode: 'hint-only', reasons }
  }

  push(reasons, 'open-tasks', String(input.openTaskCount))

  if (input.goalDrive) {
    push(reasons, 'goal-decomposed')
    if (input.specCreated) push(reasons, 'spec-created')
    else push(reasons, 'spec-reused')
  }

  if (input.groundingBlocked) {
    push(reasons, 'grounding-blocked')
    return { mode: 'pause', reasons }
  }
  push(reasons, 'grounding-ok')

  if (input.driftWarn) push(reasons, 'drift-warn')

  if (input.queueBusy) {
    push(reasons, 'queue-busy')
    return { mode: 'pause', reasons }
  }
  push(reasons, 'queue-idle')

  const gitDirty = input.gitModifiedCount > 0
  if (gitDirty) {
    push(reasons, 'git-dirty')
    if (input.backgroundAgentEnabled) {
      push(reasons, 'background-unavailable')
    }
    push(reasons, 'foreground-preferred')
    return { mode: 'foreground', reasons }
  }
  push(reasons, 'git-clean')

  if (input.driftWarn) {
    push(reasons, 'foreground-preferred')
    return { mode: 'foreground', reasons }
  }

  if (input.backgroundAgentEnabled) {
    push(reasons, 'background-available')
    return { mode: 'background', reasons }
  }

  push(reasons, 'background-unavailable')
  push(reasons, 'foreground-preferred')
  return { mode: 'foreground', reasons }
}
