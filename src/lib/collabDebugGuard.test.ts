import { describe, expect, it } from 'vitest'
import { isCollaborationDebugBlocked } from './collabDebugGuard'

describe('isCollaborationDebugBlocked', () => {
  it('blocks viewers in a collaboration room', () => {
    expect(isCollaborationDebugBlocked('room-1', 'viewer')).toBe(true)
  })

  it('allows host and editor', () => {
    expect(isCollaborationDebugBlocked('room-1', 'host')).toBe(false)
    expect(isCollaborationDebugBlocked('room-1', 'editor')).toBe(false)
  })

  it('allows debug outside collaboration', () => {
    expect(isCollaborationDebugBlocked(null, 'viewer')).toBe(false)
    expect(isCollaborationDebugBlocked('', null)).toBe(false)
  })
})
