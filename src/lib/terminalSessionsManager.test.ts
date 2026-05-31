import { describe, expect, it, beforeEach } from 'vitest'
import {
  createTerminalSession,
  initTerminalSessions,
  switchTerminalSession,
  appendToActiveSession,
  getActiveSessionOutputLines,
  closeTerminalSession,
  DEFAULT_TERMINAL_SESSION_ID,
} from './terminalSessionsManager'

describe('terminalSessionsManager', () => {
  beforeEach(() => {
    initTerminalSessions(null)
  })

  it('creates and switches sessions with isolated buffers', () => {
    appendToActiveSession('session-a\n')
    const created = createTerminalSession()
    expect(created).not.toBeNull()
    const replay = switchTerminalSession(created!.id)
    expect(replay).toBe('')
    appendToActiveSession('session-b\n')
    const back = switchTerminalSession(DEFAULT_TERMINAL_SESSION_ID)
    expect(back).toContain('session-a')
    expect(getActiveSessionOutputLines()).toContain('session-a')
  })

  it('cannot close the default session', () => {
    expect(closeTerminalSession(DEFAULT_TERMINAL_SESSION_ID)).toBe(false)
  })
})
