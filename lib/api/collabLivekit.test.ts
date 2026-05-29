import { describe, expect, it } from 'vitest'
import { appendLivekitToken, createLivekitAccessToken, isLivekitConfigured } from './collabLivekit'

describe('collabLivekit', () => {
  it('isLivekitConfigured is false without env', () => {
    const prev = {
      url: process.env.LIVEKIT_URL,
      key: process.env.LIVEKIT_API_KEY,
      secret: process.env.LIVEKIT_API_SECRET,
    }
    delete process.env.LIVEKIT_URL
    delete process.env.LIVEKIT_API_KEY
    delete process.env.LIVEKIT_API_SECRET
    expect(isLivekitConfigured()).toBe(false)
    process.env.LIVEKIT_URL = prev.url
    process.env.LIVEKIT_API_KEY = prev.key
    process.env.LIVEKIT_API_SECRET = prev.secret
  })

  it('appendLivekitToken passes through yjs-webrtc payload', async () => {
    const payload = {
      mode: 'yjs-webrtc' as const,
      roomChannel: 'ai-ide-abc',
      signalingUrls: ['wss://signaling.yjs.dev'],
    }
    const out = await appendLivekitToken(payload, 'user-1')
    expect(out).toEqual(payload)
  })

  it('createLivekitAccessToken returns null without credentials', async () => {
    const prevKey = process.env.LIVEKIT_API_KEY
    const prevSecret = process.env.LIVEKIT_API_SECRET
    delete process.env.LIVEKIT_API_KEY
    delete process.env.LIVEKIT_API_SECRET
    await expect(createLivekitAccessToken('room', 'u1')).resolves.toBeNull()
    process.env.LIVEKIT_API_KEY = prevKey
    process.env.LIVEKIT_API_SECRET = prevSecret
  })

  it('createLivekitAccessToken returns jwt when credentials set', async () => {
    const prevKey = process.env.LIVEKIT_API_KEY
    const prevSecret = process.env.LIVEKIT_API_SECRET
    process.env.LIVEKIT_API_KEY = 'test-key'
    process.env.LIVEKIT_API_SECRET = 'test-secret'
    const jwt = await createLivekitAccessToken('room-abc', 'user-1', 'Alice')
    expect(typeof jwt).toBe('string')
    expect(jwt!.length).toBeGreaterThan(20)
    process.env.LIVEKIT_API_KEY = prevKey
    process.env.LIVEKIT_API_SECRET = prevSecret
  })
})
