import type { CollaborationMember, CollaborationRoom } from '@prisma/client'
import { prisma } from '../../src/lib/prisma'
import { appendLivekitToken } from './collabLivekit'
import { canManageCollabMember } from './collabPermissions'
import {
  COLLAB_ROOM_CODE_LENGTH,
  type CollabMemberRole,
  type CollabSignalingPayload,
  isCollabMemberRole,
} from './collabTypes'

const DEFAULT_YJS_SIGNALING = ['wss://signaling.yjs.dev']

function resolveYjsSignalingUrls(): string[] {
  const custom = process.env.COLLAB_SIGNALING_URL?.trim()
  if (custom) return [custom]
  const list = process.env.COLLAB_SIGNALING_URLS?.split(',').map((s) => s.trim()).filter(Boolean)
  if (list?.length) return list
  return DEFAULT_YJS_SIGNALING
}

function randomRoomCode(): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + COLLAB_ROOM_CODE_LENGTH)
    .toLowerCase()
}

async function uniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomRoomCode()
    const existing = await prisma.collaborationRoom.findUnique({ where: { code } })
    if (!existing) return code
  }
  throw new Error('COLLAB_CODE_GENERATION_FAILED')
}

export function buildCollabSignaling(room: CollaborationRoom): CollabSignalingPayload {
  const livekitUrl = process.env.LIVEKIT_URL?.trim()
  const hasLivekit =
    livekitUrl &&
    process.env.LIVEKIT_API_KEY?.trim() &&
    process.env.LIVEKIT_API_SECRET?.trim()

  if (hasLivekit) {
    return {
      mode: 'livekit',
      roomChannel: room.code,
      livekitUrl,
      signalingUrls: resolveYjsSignalingUrls(),
    }
  }

  return {
    mode: 'yjs-webrtc',
    roomChannel: `ai-ide-${room.code}`,
    signalingUrls: resolveYjsSignalingUrls(),
  }
}

export async function buildCollabSignalingForUser(
  room: CollaborationRoom,
  userId: string,
  displayName?: string,
): Promise<CollabSignalingPayload> {
  return appendLivekitToken(buildCollabSignaling(room), userId, displayName)
}

export function serializeCollabMember(member: CollaborationMember) {
  return {
    id: member.id,
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    leftAt: member.leftAt?.toISOString() ?? null,
  }
}

export function serializeCollabRoom(
  room: CollaborationRoom,
  members: CollaborationMember[],
  signaling?: CollabSignalingPayload,
) {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    status: room.status,
    hostId: room.hostId,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
    members: members.map(serializeCollabMember),
    signaling: signaling ?? buildCollabSignaling(room),
  }
}

export async function createCollaborationRoom(userId: string, name?: string | null) {
  const code = await uniqueRoomCode()
  const trimmedName = name?.trim() || null

  const room = await prisma.collaborationRoom.create({
    data: {
      code,
      hostId: userId,
      name: trimmedName,
      status: 'open',
      members: {
        create: {
          userId,
          role: 'host',
        },
      },
    },
    include: { members: true },
  })

  return room
}

export async function getCollaborationRoomByCode(code: string) {
  const normalized = code.trim().toLowerCase()
  if (!normalized) return null
  return prisma.collaborationRoom.findUnique({
    where: { code: normalized },
    include: { members: { where: { leftAt: null } } },
  })
}

export async function listCollaborationRoomsForUser(userId: string) {
  return prisma.collaborationRoom.findMany({
    where: {
      OR: [{ hostId: userId }, { members: { some: { userId, leftAt: null } } }],
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: { members: { where: { leftAt: null } } },
  })
}

export async function joinCollaborationRoom(
  userId: string,
  code: string,
  requestedRole: CollabMemberRole,
): Promise<
  | { ok: true; room: CollaborationRoom; members: CollaborationMember[] }
  | { ok: false; reason: 'not_found' | 'closed' | 'forbidden' }
> {
  const room = await getCollaborationRoomByCode(code)
  if (!room) return { ok: false, reason: 'not_found' }
  if (room.status === 'closed') return { ok: false, reason: 'closed' }

  const isHost = room.hostId === userId
  const role: CollabMemberRole = isHost ? 'host' : requestedRole === 'viewer' ? 'viewer' : 'editor'

  if (!isHost && requestedRole === 'host') {
    return { ok: false, reason: 'forbidden' }
  }

  await prisma.collaborationMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId } },
    create: { roomId: room.id, userId, role },
    update: { role, leftAt: null, joinedAt: new Date() },
  })

  const refreshed = await getCollaborationRoomByCode(code)
  if (!refreshed) return { ok: false, reason: 'not_found' }

  return { ok: true, room: refreshed, members: refreshed.members }
}

export async function leaveCollaborationRoom(
  userId: string,
  code: string,
): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'not_member' }> {
  const room = await getCollaborationRoomByCode(code)
  if (!room) return { ok: false, reason: 'not_found' }

  const member = await prisma.collaborationMember.findUnique({
    where: { roomId_userId: { roomId: room.id, userId } },
  })
  if (!member) return { ok: false, reason: 'not_member' }

  await prisma.collaborationMember.update({
    where: { id: member.id },
    data: { leftAt: new Date() },
  })

  return { ok: true }
}

export async function getCollaborationMemberRole(
  userId: string,
  code: string,
): Promise<CollabMemberRole | null> {
  const room = await getCollaborationRoomByCode(code)
  if (!room) return null
  if (room.hostId === userId) return 'host'
  const member = room.members.find((m) => m.userId === userId)
  if (!member) return null
  return isCollabMemberRole(member.role) ? member.role : 'editor'
}

export async function updateCollaborationMemberRole(
  actorUserId: string,
  code: string,
  targetUserId: string,
  nextRole: 'editor' | 'viewer',
): Promise<
  | { ok: true; room: CollaborationRoom; members: CollaborationMember[] }
  | { ok: false; reason: 'not_found' | 'forbidden' | 'invalid_role' | 'target_not_found' }
> {
  const room = await getCollaborationRoomByCode(code)
  if (!room) return { ok: false, reason: 'not_found' }

  const target = room.members.find((m) => m.userId === targetUserId)
  if (!target) return { ok: false, reason: 'target_not_found' }

  const targetRole = isCollabMemberRole(target.role) ? target.role : 'editor'
  if (!canManageCollabMember(actorUserId, room.hostId, targetRole)) {
    return { ok: false, reason: 'forbidden' }
  }

  await prisma.collaborationMember.update({
    where: { id: target.id },
    data: { role: nextRole },
  })

  const refreshed = await getCollaborationRoomByCode(code)
  if (!refreshed) return { ok: false, reason: 'not_found' }

  return { ok: true, room: refreshed, members: refreshed.members }
}

export async function kickCollaborationMember(
  actorUserId: string,
  code: string,
  targetUserId: string,
): Promise<
  | { ok: true; room: CollaborationRoom; members: CollaborationMember[] }
  | { ok: false; reason: 'not_found' | 'forbidden' | 'target_not_found' }
> {
  const room = await getCollaborationRoomByCode(code)
  if (!room) return { ok: false, reason: 'not_found' }

  const target = await prisma.collaborationMember.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: targetUserId } },
  })
  if (!target || target.leftAt) return { ok: false, reason: 'target_not_found' }

  const targetRole = isCollabMemberRole(target.role) ? target.role : 'editor'
  if (!canManageCollabMember(actorUserId, room.hostId, targetRole)) {
    return { ok: false, reason: 'forbidden' }
  }

  await prisma.collaborationMember.update({
    where: { id: target.id },
    data: { leftAt: new Date() },
  })

  const refreshed = await getCollaborationRoomByCode(code)
  if (!refreshed) return { ok: false, reason: 'not_found' }

  return { ok: true, room: refreshed, members: refreshed.members }
}
