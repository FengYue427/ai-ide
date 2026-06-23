import { describe, expect, it } from 'vitest'
import {
  createAutopilotLoopState,
  evaluateAutopilotLoopStep,
  formatAutopilotLoopProgress,
  MAX_AUTOPILOT_LOOP_STEPS,
  stopAutopilotLoopState,
} from './autopilotLoop'

describe('autopilotLoop', () => {
  it('creates active loop state', () => {
    const loop = createAutopilotLoopState('.aide/specs/capstone/tasks.md', 5)
    expect(loop.active).toBe(true)
    expect(loop.openAtStart).toBe(5)
    expect(loop.stepsCompleted).toBe(0)
  })

  it('stops when no tasks remain', () => {
    const loop = createAutopilotLoopState('tasks.md', 2)
    expect(evaluateAutopilotLoopStep({ loop, remainingOpenTasks: 0 }).action).toBe('stop')
  })

  it('stops at max steps', () => {
    const loop = {
      ...createAutopilotLoopState('tasks.md', 30),
      stepsCompleted: MAX_AUTOPILOT_LOOP_STEPS - 1,
    }
    const result = evaluateAutopilotLoopStep({ loop, remainingOpenTasks: 10 })
    expect(result).toEqual({ action: 'stop', reason: 'max-steps' })
  })

  it('continues while under cap and tasks remain', () => {
    const loop = createAutopilotLoopState('tasks.md', 4)
    expect(evaluateAutopilotLoopStep({ loop, remainingOpenTasks: 3 }).action).toBe('continue')
  })

  it('formats progress totals', () => {
    const loop = stopAutopilotLoopState(createAutopilotLoopState('tasks.md', 4), 'paused', 2)
    expect(formatAutopilotLoopProgress(loop, 2)).toEqual({ completed: 2, total: 4 })
  })
})
