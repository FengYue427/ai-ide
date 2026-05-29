/**
 * Collaboration room by invite code — get + join (v1.1.3 F1)
 */
import { jsonResponse } from '../../../http'
import { requireAuth } from '../../../requireAuth'
import { readJsonWithLimit } from '../../../body'
import { appendApiMessage, localizedErrorResponse } from '../../../localizedError'
import {
  buildCollabSignalingForUser,
  getCollaborationRoomByCode,
  joinCollaborationRoom,
  serializeCollabRoom,
} from '../../../collaborationRoomsService'
import { normalizeJoinRole } from '../../../collabTypes'

const MAX_BODY_BYTES = 4_000

export async function GET(req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const code = ctx?.params?.code?.trim().toLowerCase()
  if (!code) {
    return localizedErrorResponse(req, 'api.collab.codeRequired', 400)
  }

  try {
    const room = await getCollaborationRoomByCode(code)
    if (!room) {
      return localizedErrorResponse(req, 'api.collab.roomNotFound', 404)
    }

    const isMember = room.members.some((m) => m.userId === auth.user.id)
    if (!isMember && room.hostId !== auth.user.id) {
      return localizedErrorResponse(req, 'api.collab.notMember', 403)
    }

    const signaling = await buildCollabSignalingForUser(
      room,
      auth.user.id,
      auth.user.name ?? undefined,
    )
    return jsonResponse({
      room: serializeCollabRoom(room, room.members, signaling),
    })
  } catch (error) {
    console.error('[Collab] Get room error:', error)
    return localizedErrorResponse(req, 'api.collab.loadFailed', 500)
  }
}

export async function POST(req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const code = ctx?.params?.code?.trim().toLowerCase()
  if (!code) {
    return localizedErrorResponse(req, 'api.collab.codeRequired', 400)
  }

  try {
    const parsed = await readJsonWithLimit<{ role?: unknown }>(req, MAX_BODY_BYTES)
    if (!parsed.ok) return parsed.response

    const roomPreview = await getCollaborationRoomByCode(code)
    const isHost = roomPreview?.hostId === auth.user.id
    const requestedRole = normalizeJoinRole(parsed.value.role, isHost)

    const result = await joinCollaborationRoom(auth.user.id, code, requestedRole)
    if (!result.ok) {
      if (result.reason === 'not_found') {
        return localizedErrorResponse(req, 'api.collab.roomNotFound', 404)
      }
      if (result.reason === 'closed') {
        return localizedErrorResponse(req, 'api.collab.roomClosed', 409)
      }
      return localizedErrorResponse(req, 'api.collab.joinForbidden', 403)
    }

    const signaling = await buildCollabSignalingForUser(
      result.room,
      auth.user.id,
      auth.user.name ?? undefined,
    )
    return jsonResponse(
      appendApiMessage(req, 'api.collab.joined', {
        room: serializeCollabRoom(result.room, result.members, signaling),
      }),
    )
  } catch (error) {
    console.error('[Collab] Join room error:', error)
    return localizedErrorResponse(req, 'api.collab.joinFailed', 500)
  }
}
