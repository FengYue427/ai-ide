import { describe, expect, it } from 'vitest'
import { formatAutonomyPauseFeedback, formatAutonomyStartBlockedFeedback } from './autonomyPauseFeedback'

describe('autonomyPauseFeedback', () => {
  const t = (key: string, params?: Record<string, string>) => {
    if (key === 'linkage.policy.mode.pause') return '暂停'
    if (key === 'linkage.policy.mode.foreground') return '步内循环'
    if (key === 'linkage.reason.quotaBlocked') return '配额已用尽'
    if (key === 'linkage.reason.groundingBlocked') return 'Grounding 阻断'
    if (key === 'linkage.reason.gitDirty') return 'Git 有未提交变更'
    if (key === 'intent.autopilot.autonomyBlockedTitle') return '自动未启动'
    if (key === 'intent.autopilot.loopBlockedTitle') return '步内循环未启动'
    if (key === 'intent.autopilot.backgroundForegroundTitle') return '后台续跑不可用'
    if (key === 'intent.autopilot.autonomyBlockedDetail') {
      return `${params?.mode} · ${params?.because}`
    }
    return key
  }

  it('formats pause feedback with mode and because chain', () => {
    const feedback = formatAutonomyPauseFeedback(
      {
        mode: 'pause',
        reasons: [{ id: 'quota-blocked' }, { id: 'grounding-blocked' }],
      },
      t,
    )

    expect(feedback.title).toBe('自动未启动')
    expect(feedback.detail).toContain('暂停')
    expect(feedback.detail).toContain('配额已用尽')
  })

  it('returns loop blocked feedback for pause mode only', () => {
    expect(
      formatAutonomyStartBlockedFeedback({ mode: 'foreground', reasons: [] }, t, 'loop'),
    ).toBeNull()
    expect(
      formatAutonomyStartBlockedFeedback({ mode: 'pause', reasons: [{ id: 'quota-blocked' }] }, t, 'loop')
        ?.title,
    ).toBe('步内循环未启动')
  })

  it('returns background feedback when foreground is preferred', () => {
    const feedback = formatAutonomyStartBlockedFeedback(
      { mode: 'foreground', reasons: [{ id: 'git-dirty' }] },
      t,
      'background',
    )
    expect(feedback?.title).toBe('后台续跑不可用')
    expect(feedback?.detail).toContain('Git 有未提交变更')
  })
})
