import { AccessToken } from 'livekit-server-sdk'
import type { CollabSignalingPayload } from './collabTypes'

export function isLivekitConfigured(): boolean {
  return Boolean(
    process.env.LIVEKIT_URL?.trim() &&
      process.env.LIVEKIT_API_KEY?.trim() &&
      process.env.LIVEKIT_API_SECRET?.trim(),
  )
}

export async function createLivekitAccessToken(
  roomName: string,
  identity: string,
  displayName?: string,
): Promise<string | null> {
  const apiKey = process.env.LIVEKIT_API_KEY?.trim()
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim()
  if (!apiKey || !apiSecret) return null

  try {
    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name: displayName ?? identity,
      ttl: 2 * 60 * 60,
    })
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })
    return await token.toJwt()
  } catch (error) {
    console.error('[Collab] Livekit token generation failed:', error)
    return null
  }
}

export async function appendLivekitToken(
  payload: CollabSignalingPayload,
  userId: string,
  displayName?: string,
): Promise<CollabSignalingPayload> {
  if (payload.mode !== 'livekit') return payload
  const jwt = await createLivekitAccessToken(payload.roomChannel, userId, displayName)
  if (!jwt) return payload
  return { ...payload, livekitToken: jwt }
}
