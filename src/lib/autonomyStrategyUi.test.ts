import { describe, expect, it } from 'vitest'
import { buildAutonomyStrategyUiState, detectAutonomyActiveChannel } from './autonomyStrategyUi'
import { evaluateAutonomyPolicy } from './autonomyPolicy'

describe('autonomyStrategyUi', () => {
  it('detects active channel priority', () => {
    expect(
      detectAutonomyActiveChannel({ loopActive: true, backgroundWatchActive: true, goalDriveActive: true }),
    ).toBe('goal-drive')
    expect(detectAutonomyActiveChannel({ loopActive: true, backgroundWatchActive: false, goalDriveActive: false })).toBe(
      'loop',
    )
  })

  it('offers background execute when policy says background', () => {
    const policy = evaluateAutonomyPolicy({
      tasksPath: '.aide/specs/a/tasks.md',
      openTaskCount: 2,
      gitModifiedCount: 0,
      queueBusy: false,
      groundingBlocked: false,
      backgroundAgentEnabled: true,
      quotaBlocked: false,
    })
    const ui = buildAutonomyStrategyUiState({
      policy,
      loopActive: false,
      backgroundWatchActive: false,
      goalDriveActive: false,
      openTaskCount: 2,
      quotaBlocked: false,
    })
    expect(ui.canExecute).toBe(true)
    expect(ui.executeModeKey).toBe('linkage.autonomy.executeBackground')
  })

  it('shows pause when loop is active', () => {
    const policy = evaluateAutonomyPolicy({
      tasksPath: '.aide/specs/a/tasks.md',
      openTaskCount: 2,
      gitModifiedCount: 0,
      queueBusy: false,
      groundingBlocked: false,
      backgroundAgentEnabled: true,
      quotaBlocked: false,
    })
    const ui = buildAutonomyStrategyUiState({
      policy,
      loopActive: true,
      backgroundWatchActive: false,
      goalDriveActive: false,
      openTaskCount: 2,
      quotaBlocked: false,
    })
    expect(ui.activeChannel).toBe('loop')
    expect(ui.executeModeKey).toBe('linkage.autonomy.pause')
  })
})
