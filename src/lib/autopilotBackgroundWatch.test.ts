import { describe, expect, it } from 'vitest'
import {
  evaluateAutopilotBackgroundWatchStep,
  formatAutopilotBackgroundWatchProgress,
  createAutopilotBackgroundWatchState,
  stopAutopilotBackgroundWatchState,
  MAX_AUTOPILOT_BACKGROUND_STEPS,
} from './autopilotBackgroundWatch'

describe('autopilotBackgroundWatch', () => {
  it('stops when no open tasks remain', () => {
    const watch = createAutopilotBackgroundWatchState('.aide/specs/a/tasks.md')
    expect(evaluateAutopilotBackgroundWatchStep({ watch, remainingOpenTasks: 0 })).toEqual({
      action: 'stop',
      reason: 'completed',
    })
  })

  it('stops at max steps', () => {
    const watch = {
      ...createAutopilotBackgroundWatchState('.aide/specs/a/tasks.md'),
      stepsQueued: MAX_AUTOPILOT_BACKGROUND_STEPS,
    }
    expect(evaluateAutopilotBackgroundWatchStep({ watch, remainingOpenTasks: 3 })).toEqual({
      action: 'stop',
      reason: 'max-steps',
    })
  })

  it('formats progress', () => {
    const watch = { ...createAutopilotBackgroundWatchState('p'), stepsQueued: 2 }
    expect(formatAutopilotBackgroundWatchProgress(watch, 4)).toEqual({ queued: 2, remaining: 4 })
  })

  it('records stop reason', () => {
    const watch = createAutopilotBackgroundWatchState('p')
    const stopped = stopAutopilotBackgroundWatchState(watch, 'paused')
    expect(stopped.active).toBe(false)
    expect(stopped.stopReason).toBe('paused')
  })
})
