import { describe, expect, it } from 'vitest'
import { formatAutonomyPauseFeedback } from './autonomyPauseFeedback'

describe('autonomyPauseFeedback', () => {
  it('formats pause feedback with mode and because chain', () => {
    const feedback = formatAutonomyPauseFeedback(
      {
        mode: 'pause',
        reasons: [{ id: 'quota-blocked' }, { id: 'grounding-blocked' }],
      },
      (key, params) => {
        if (key === 'linkage.policy.mode.pause') return '暂停'
        if (key === 'linkage.reason.quotaBlocked') return '配额已用尽'
        if (key === 'linkage.reason.groundingBlocked') return 'Grounding 阻断'
        if (key === 'intent.autopilot.autonomyBlockedTitle') return '自动未启动'
        if (key === 'intent.autopilot.autonomyBlockedDetail') {
          return `${params?.mode} · ${params?.because}`
        }
        return key
      },
    )

    expect(feedback.title).toBe('自动未启动')
    expect(feedback.detail).toContain('暂停')
    expect(feedback.detail).toContain('配额已用尽')
  })
})
