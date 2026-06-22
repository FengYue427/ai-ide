import { describe, expect, it, vi } from 'vitest'
import { emitAideLinkEvent, getLastAideLinkEvent, subscribeAideLink } from './aideLinkBus'

describe('aideLinkBus', () => {
  it('notifies subscribers and stores last event', () => {
    const handler = vi.fn()
    const unsub = subscribeAideLink(handler)
    const event = emitAideLinkEvent('share-created', { shareId: 'abc' })
    expect(handler).toHaveBeenCalledWith(event)
    expect(getLastAideLinkEvent()?.payload?.shareId).toBe('abc')
    unsub()
  })
})
