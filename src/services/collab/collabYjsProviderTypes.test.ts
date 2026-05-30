import { describe, expect, it } from 'vitest'
import { shouldUseLivekitSignaling } from './collabYjsProviderTypes'

describe('shouldUseLivekitSignaling', () => {
  it('returns false for yjs-webrtc mode', () => {
    expect(
      shouldUseLivekitSignaling({
        mode: 'yjs-webrtc',
      }),
    ).toBe(false)
  })

  it('returns false when livekit token or url missing', () => {
    expect(
      shouldUseLivekitSignaling({
        mode: 'livekit',
        livekitUrl: 'wss://livekit.example.com',
      }),
    ).toBe(false)
    expect(
      shouldUseLivekitSignaling({
        mode: 'livekit',
        livekitToken: 'jwt',
      }),
    ).toBe(false)
  })

  it('returns true when livekit mode has url and token', () => {
    expect(
      shouldUseLivekitSignaling({
        mode: 'livekit',
        livekitUrl: 'wss://livekit.example.com',
        livekitToken: 'eyJ.test',
      }),
    ).toBe(true)
  })
})
