import type * as awarenessProtocol from 'y-protocols/awareness'

/** Minimal surface shared by y-webrtc and Livekit Yjs providers. */
export type CollabYjsProvider = {
  awareness: awarenessProtocol.Awareness
  connected: boolean
  on(event: 'status', handler: (event: { connected: boolean }) => void): void
  off(event: 'status', handler: (event: { connected: boolean }) => void): void
  destroy(): void
}

export function shouldUseLivekitSignaling(signaling?: {
  mode?: string
  livekitUrl?: string
  livekitToken?: string
}): boolean {
  return (
    signaling?.mode === 'livekit' &&
    Boolean(signaling.livekitUrl?.trim()) &&
    Boolean(signaling.livekitToken?.trim())
  )
}
