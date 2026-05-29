import { describe, expect, it, vi } from 'vitest'
import { offerSyncAideAfterPlanWrite, runAideWorkspaceSyncWithNotify } from './planAideSyncPromptService'

const t = (key: string, params?: Record<string, string | number>) => {
  if (params) return `${key}:${JSON.stringify(params)}`
  return key
}

describe('planAideSyncPromptService', () => {
  it('offerSyncAideAfterPlanWrite skips when no .aide files', async () => {
    const requestConfirm = vi.fn()
    const result = await offerSyncAideAfterPlanWrite(
      [{ name: 'src/index.ts', content: '', language: 'typescript' }],
      requestConfirm,
      vi.fn(),
      t,
    )
    expect(result).toBe(false)
    expect(requestConfirm).not.toHaveBeenCalled()
  })

  it('offerSyncAideAfterPlanWrite runs sync when confirmed', async () => {
    const requestConfirm = vi.fn().mockResolvedValue(true)
    const notify = vi.fn()
    const result = await offerSyncAideAfterPlanWrite(
      [{ name: '.aide/plans/p.md', content: '# Plan', language: 'markdown' }],
      requestConfirm,
      notify,
      t,
    )
    expect(requestConfirm).toHaveBeenCalledOnce()
    expect(result).toBe(true)
    expect(notify).toHaveBeenCalledWith('success', 'plan.host.syncSuccess.title', expect.any(String))
  })

  it('offerSyncAideAfterPlanWrite skips sync when declined', async () => {
    const requestConfirm = vi.fn().mockResolvedValue(false)
    const notify = vi.fn()
    const result = await offerSyncAideAfterPlanWrite(
      [{ name: '.aide/plans/p.md', content: '# Plan', language: 'markdown' }],
      requestConfirm,
      notify,
      t,
    )
    expect(result).toBe(false)
    expect(notify).not.toHaveBeenCalled()
  })

  it('runAideWorkspaceSyncWithNotify reports empty aide set', async () => {
    const notify = vi.fn()
    await runAideWorkspaceSyncWithNotify([], notify, t)
    expect(notify).toHaveBeenCalledWith('info', 'plan.host.syncNothing.title', 'plan.host.syncNothing.detail')
  })
})
