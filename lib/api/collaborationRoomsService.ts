import type { CollaborationMember, CollaborationRoom } from '@prisma/client'
import { prisma } from '../../src/lib/prisma'
import {
  COLLAB_ROOM_CODE_LENGTH,
  type CollabMemberRole,
  type CollabSignalingPayload,
} from './collabTypes'

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
      // F2: issue Livekit access token via livekit-server-sdk
    }
  }

  return {
    mode: 'yjs-webrtc',
    roomChannel: `ai-ide-${room.code}`,
  }
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
