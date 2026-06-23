import { describe, expect, it } from 'vitest'
import { evaluateAutonomyPolicy } from './autonomyPolicy'

describe('autonomyPolicy', () => {
  it('prefers background when git clean and agent enabled', () => {
    const result = evaluateAutonomyPolicy({
      tasksPath: '.aide/specs/a/tasks.md',
      openTaskCount: 2,
      gitModifiedCount: 0,
      queueBusy: false,
      groundingBlocked: false,
      backgroundAgentEnabled: true,
      quotaBlocked: false,
    })
    expect(result.mode).toBe('background')
    expect(result.reasons.some((r) => r.id === 'background-available')).toBe(true)
  })

  it('pauses on grounding block', () => {
    const result = evaluateAutonomyPolicy({
      tasksPath: '.aide/specs/a/tasks.md',
      openTaskCount: 1,
      gitModifiedCount: 0,
      queueBusy: false,
      groundingBlocked: true,
      backgroundAgentEnabled: true,
      quotaBlocked: false,
    })
    expect(result.mode).toBe('pause')
    expect(result.reasons.some((r) => r.id === 'grounding-blocked')).toBe(true)
  })

  it('foreground when git dirty', () => {
    const result = evaluateAutonomyPolicy({
      tasksPath: '.aide/specs/a/tasks.md',
      openTaskCount: 1,
      gitModifiedCount: 2,
      queueBusy: false,
      groundingBlocked: false,
      backgroundAgentEnabled: true,
      quotaBlocked: false,
    })
    expect(result.mode).toBe('foreground')
    expect(result.reasons.some((r) => r.id === 'git-dirty')).toBe(true)
  })

  it('foreground when drift warn even if background available', () => {
    const result = evaluateAutonomyPolicy({
      tasksPath: '.aide/specs/a/tasks.md',
      openTaskCount: 2,
      gitModifiedCount: 0,
      queueBusy: false,
      groundingBlocked: false,
      backgroundAgentEnabled: true,
      quotaBlocked: false,
      driftWarn: true,
    })
    expect(result.mode).toBe('foreground')
    expect(result.reasons.some((r) => r.id === 'drift-warn')).toBe(true)
    expect(result.reasons.some((r) => r.id === 'background-available')).toBe(false)
  })
})
