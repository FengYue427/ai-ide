import type { DebugAttachPhase } from '../services/debugAlphaService'
import type { DebugSessionState } from '../store/ideStore'

const INACTIVE_PHASES: DebugAttachPhase[] = ['idle', 'ended', 'failed']

/** True while a debug session owns the runtime (v1.1.7 F4). */
export function isDebugSessionActive(phase: DebugAttachPhase): boolean {
  return !INACTIVE_PHASES.includes(phase)
}

/** Continue / step commands require CDP sync and a paused session. */
export function canUseDebugExecutionControls(session: Pick<DebugSessionState, 'phase' | 'syncMode'>): boolean {
  return session.phase === 'paused' && session.syncMode === 'cdp'
}
