export const MAX_AUTOPILOT_LOOP_STEPS = 20

export type AutopilotLoopStopReason =
  | 'paused'
  | 'completed'
  | 'quota'
  | 'failed'
  | 'max-steps'
  | 'no-tasks'

export interface AutopilotLoopState {
  active: boolean
  tasksPath: string
  startedAt: string
  stepsCompleted: number
  openAtStart: number
  stopReason?: AutopilotLoopStopReason
}

export function createAutopilotLoopState(tasksPath: string, openAtStart: number): AutopilotLoopState {
  return {
    active: true,
    tasksPath,
    startedAt: new Date().toISOString(),
    stepsCompleted: 0,
    openAtStart,
  }
}

export function stopAutopilotLoopState(
  loop: AutopilotLoopState,
  reason: AutopilotLoopStopReason,
  stepsCompleted?: number,
): AutopilotLoopState {
  return {
    ...loop,
    active: false,
    stopReason: reason,
    stepsCompleted: stepsCompleted ?? loop.stepsCompleted,
  }
}

export function evaluateAutopilotLoopStep(input: {
  loop: AutopilotLoopState
  remainingOpenTasks: number
}): { action: 'continue' } | { action: 'stop'; reason: AutopilotLoopStopReason } {
  const nextCompleted = input.loop.stepsCompleted + 1
  if (input.remainingOpenTasks <= 0) {
    return { action: 'stop', reason: 'completed' }
  }
  if (nextCompleted >= MAX_AUTOPILOT_LOOP_STEPS) {
    return { action: 'stop', reason: 'max-steps' }
  }
  return { action: 'continue' }
}

export function formatAutopilotLoopProgress(loop: AutopilotLoopState, remainingOpen: number): {
  completed: number
  total: number
} {
  const total = Math.max(loop.openAtStart, loop.stepsCompleted + remainingOpen)
  return { completed: loop.stepsCompleted, total }
}
