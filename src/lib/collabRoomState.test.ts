import { describe, expect, it } from 'vitest'
import { resolveCollabMemberRole } from './collabRoomState'
import type { CollabRoomClient } from '../services/collabRoomsApiService'

function room(partial: Partial<CollabRoomClient> & Pick<CollabRoomClient, 'hostId'>): CollabRoomClient {
  return {
    id: 'r1',
    code: 'abc12345',
    name: null,
    status: 'open',
    members: [],
    signaling: { mode: 'yjs-webrtc', roomChannel: 'ai-ide-abc12345' },
    ...partial,
  }
}

describe('resolveCollabMemberRole', () => {
  it('returns host when user is room host', () => {
    expect(resolveCollabMemberRole(room({ hostId: 'u1' }), 'u1')).toBe('host')
  })

  it('returns viewer from member record', () => {
    const r = room({
      hostId: 'host',
      members: [{ id: 'm1', userId: 'u2', role: 'viewer', joinedAt: '', leftAt: null }],
    })
    expect(resolveCollabMemberRole(r, 'u2')).toBe('viewer')
  })

  it('defaults to editor for unknown member', () => {
    expect(resolveCollabMemberRole(room({ hostId: 'host' }), 'guest')).toBe('editor')
  })
})
