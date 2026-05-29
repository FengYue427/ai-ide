/**
 * Collaboration rooms — create + list (v1.1.3 F1)
 */
import { jsonResponse } from '../../../http'
import { requireAuth } from '../../../requireAuth'
import { readJsonWithLimit } from '../../../body'
import { appendApiMessage, localizedErrorResponse } from '../../../localizedError'
import {
  buildCollabSignalingForUser,
  createCollaborationRoom,
  listCollaborationRoomsForUser,
  serializeCollabRoom,
} from '../../../collaborationRoomsService'
import { MAX_COLLAB_ROOM_NAME_CHARS } from '../../../collabTypes'

const MAX_BODY_BYTES = 8_000

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const rooms = await listCollaborationRoomsForUser(auth.user.id)
    return jsonResponse({
      rooms: rooms.map((room) => serializeCollabRoom(room, room.members)),
    })
  } catch (error) {
    console.error('[Collab] List rooms error:', error)
    return localizedErrorResponse(req, 'api.collab.listFailed', 500)
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const parsed = await readJsonWithLimit<{ name?: unknown }>(req, MAX_BODY_BYTES)
    if (!parsed.ok) return parsed.response

    const name = typeof parsed.value.name === 'string' ? parsed.value.name.trim() : ''
    if (name.length > MAX_COLLAB_ROOM_NAME_CHARS) {
      return localizedErrorResponse(req, 'api.collab.nameTooLong', 400)
    }

    const room = await createCollaborationRoom(auth.user.id, name || null)
    const signaling = await buildCollabSignalingForUser(
      room,
      auth.user.id,
      auth.user.name ?? undefined,
    )
    return jsonResponse(
      appendApiMessage(req, 'api.collab.roomCreated', {
        room: serializeCollabRoom(room, room.members, signaling),
      }),
      201,
    )
  } catch (error) {
    console.error('[Collab] Create room error:', error)
    return localizedErrorResponse(req, 'api.collab.createFailed', 500)
  }
}
