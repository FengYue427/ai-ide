export const COLLAB_ROOM_STATUSES = ['open', 'closed'] as const
export type CollabRoomStatus = (typeof COLLAB_ROOM_STATUSES)[number]

export const COLLAB_MEMBER_ROLES = ['host', 'editor', 'viewer'] as const
export type CollabMemberRole = (typeof COLLAB_MEMBER_ROLES)[number]

export const COLLAB_ROOM_CODE_LENGTH = 8
export const MAX_COLLAB_ROOM_NAME_CHARS = 120

export type CollabSignalingPayload = {
  mode: 'yjs-webrtc' | 'livekit'
  roomChannel: string
  /** y-webrtc signaling servers (M1 may set dedicated WS). */
  signalingUrls?: string[]
  livekitUrl?: string
  livekitToken?: string
}

export function isCollabMemberRole(value: string): value is CollabMemberRole {
  return (COLLAB_MEMBER_ROLES as readonly string[]).includes(value)
}

export function normalizeJoinRole(
  raw: unknown,
  isHost: boolean,
): CollabMemberRole {
  if (isHost) return 'host'
  const role = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (role === 'viewer') return 'viewer'
  return 'editor'
}
