export const MAX_AUTOPILOT_BACKGROUND_STEPS = 20

export const AUTOPILOT_BACKGROUND_WATCH_STORAGE_KEY = 'aide.autopilot.backgroundWatch'

export type AutopilotBackgroundWatchStopReason =
  | 'paused'
  | 'completed'
  | 'failed'
  | 'max-steps'
  | 'no-tasks'
  | 'unavailable'

export interface AutopilotBackgroundWatchState {
  active: boolean
  tasksPath: string
  startedAt: string
  stepsQueued: number
  lastJobId?: string
  stopReason?: AutopilotBackgroundWatchStopReason
}

export function createAutopilotBackgroundWatchState(tasksPath: string): AutopilotBackgroundWatchState {
  return {
    active: true,
    tasksPath,
    startedAt: new Date().toISOString(),
    stepsQueued: 0,
  }
}

export function stopAutopilotBackgroundWatchState(
  watch: AutopilotBackgroundWatchState,
  reason: AutopilotBackgroundWatchStopReason,
): AutopilotBackgroundWatchState {
  return {
    ...watch,
    active: false,
    stopReason: reason,
  }
}

export function evaluateAutopilotBackgroundWatchStep(input: {
  watch: AutopilotBackgroundWatchState
  remainingOpenTasks: number
}): { action: 'continue' } | { action: 'stop'; reason: AutopilotBackgroundWatchStopReason } {
  if (input.remainingOpenTasks <= 0) {
    return { action: 'stop', reason: 'completed' }
  }
  if (input.watch.stepsQueued >= MAX_AUTOPILOT_BACKGROUND_STEPS) {
    return { action: 'stop', reason: 'max-steps' }
  }
  return { action: 'continue' }
}

export function formatAutopilotBackgroundWatchProgress(
  watch: AutopilotBackgroundWatchState,
  remainingOpen: number,
): { queued: number; remaining: number } {
  return { queued: watch.stepsQueued, remaining: remainingOpen }
}

export function loadPersistedAutopilotBackgroundWatch(): AutopilotBackgroundWatchState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTOPILOT_BACKGROUND_WATCH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AutopilotBackgroundWatchState>
    if (!parsed.tasksPath || typeof parsed.tasksPath !== 'string') return null
    if (parsed.active !== true) return null
    return {
      active: true,
      tasksPath: parsed.tasksPath,
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : new Date().toISOString(),
      stepsQueued: typeof parsed.stepsQueued === 'number' ? parsed.stepsQueued : 0,
      lastJobId: typeof parsed.lastJobId === 'string' ? parsed.lastJobId : undefined,
    }
  } catch {
    return null
  }
}

export function persistAutopilotBackgroundWatch(watch: AutopilotBackgroundWatchState | null): void {
  if (typeof localStorage === 'undefined') return
  try {
    if (!watch?.active) {
      localStorage.removeItem(AUTOPILOT_BACKGROUND_WATCH_STORAGE_KEY)
      return
    }
    localStorage.setItem(
      AUTOPILOT_BACKGROUND_WATCH_STORAGE_KEY,
      JSON.stringify({
        active: true,
        tasksPath: watch.tasksPath,
        startedAt: watch.startedAt,
        stepsQueued: watch.stepsQueued,
        lastJobId: watch.lastJobId,
      }),
    )
  } catch {
    /* ignore */
  }
}
