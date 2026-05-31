import { describe, expect, it } from 'vitest'
import { canUseDebugExecutionControls, isDebugSessionActive } from './debugSessionActive'

describe('debugSessionActive', () => {
  it('treats running and paused phases as active', () => {
    expect(isDebugSessionActive('running')).toBe(true)
    expect(isDebugSessionActive('paused')).toBe(true)
    expect(isDebugSessionActive('idle')).toBe(false)
    expect(isDebugSessionActive('ended')).toBe(false)
  })

  it('allows execution controls only when paused with CDP', () => {
    expect(canUseDebugExecutionControls({ phase: 'paused', syncMode: 'cdp' })).toBe(true)
    expect(canUseDebugExecutionControls({ phase: 'paused', syncMode: 'injected' })).toBe(false)
    expect(canUseDebugExecutionControls({ phase: 'running', syncMode: 'cdp' })).toBe(false)
  })
})
