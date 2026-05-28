import { describe, expect, it } from 'vitest'
import {
  completeRun,
  createInitialChatSessionState,
  enqueueSend,
  shiftQueue,
  startRun,
} from './chatSessionOrchestrator'

describe('chatSessionOrchestrator', () => {
  it('starts a run with runId', () => {
    const started = startRun(createInitialChatSessionState())
    expect(started.status).toBe('running')
    expect(started.runId).toMatch(/^run-/)
  })

  it('queues sends while running and shifts in order', () => {
    let state = startRun(createInitialChatSessionState())
    state = enqueueSend(state, { text: 'A' })
    state = enqueueSend(state, { text: 'B' })
    expect(state.status).toBe('queued')
    const first = shiftQueue(state)
    expect(first.next?.text).toBe('A')
    const second = shiftQueue(first.state)
    expect(second.next?.text).toBe('B')
  })

  it('completes with queued when queue still has items', () => {
    let state = startRun(createInitialChatSessionState())
    state = enqueueSend(state, { text: 'A' })
    const done = completeRun(state, 'succeeded')
    expect(done.status).toBe('queued')
  })
})
