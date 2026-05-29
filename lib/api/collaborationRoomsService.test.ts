import { beforeEach, describe, expect, it } from 'vitest'
import { buildCollabSignaling } from './collaborationRoomsService'

describe('collaborationRoomsService', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env = { ...env }
    delete process.env.LIVEKIT_URL
    delete process.env.LIVEKIT_API_KEY
    delete process.env.LIVEKIT_API_SECRET
  })

  it('defaults signaling to yjs-webrtc without Livekit env', () => {
    const signaling = buildCollabSignaling({
      id: 'r1',
      code: 'abc12345',
      hostId: 'u1',
      name: null,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(signaling.mode).toBe('yjs-webrtc')
    expect(signaling.roomChannel).toBe('ai-ide-abc12345')
  })

  it('selects livekit mode when env is configured', () => {
    process.env.LIVEKIT_URL = 'wss://livekit.example.com'
    process.env.LIVEKIT_API_KEY = 'key'
    process.env.LIVEKIT_API_SECRET = 'secret'
    const signaling = buildCollabSignaling({
      id: 'r1',
      code: 'xyz',
      hostId: 'u1',
      name: null,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(signaling.mode).toBe('livekit')
    expect(signaling.livekitUrl).toBe('wss://livekit.example.com')
  })
})
