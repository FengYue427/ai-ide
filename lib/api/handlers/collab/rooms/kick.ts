/**
 * Kick collaboration member (host only, v1.1.3 F3)
 */
import { jsonResponse } from '../../../http'
import { requireAuth } from '../../../requireAuth'
import { appendApiMessage, localizedErrorResponse } from '../../../localizedError'
import {
  buildCollabSignalingForUser,
  kickCollaborationMember,
  serializeCollabRoom,
} from '../../../collaborationRoomsService'

export async function POST(req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const code = ctx?.params?.code?.trim().toLowerCase()
  const targetUserId = ctx?.params?.userId?.trim()
  if (!code) {
    return localizedErrorResponse(req, 'api.collab.codeRequired', 400)
  }
  if (!targetUserId) {
    return localizedErrorResponse(req, 'api.collab.memberRequired', 400)
  }

  try {
    const result = await kickCollaborationMember(auth.user.id, code, targetUserId)
    if (!result.ok) {
      if (result.reason === 'not_found') {
        return localizedErrorResponse(req, 'api.collab.roomNotFound', 404)
      }
      if (result.reason === 'target_not_found') {
        return localizedErrorResponse(req, 'api.collab.memberNotFound', 404)
      }
      return localizedErrorResponse(req, 'api.collab.forbidden', 403)
    }

    const signaling = await buildCollabSignalingForUser(
      result.room,
      auth.user.id,
      auth.user.name ?? undefined,
    )
    return jsonResponse(
      appendApiMessage(req, 'api.collab.memberKicked', {
        room: serializeCollabRoom(result.room, result.members, signaling),
      }),
    )
  } catch (error) {
    console.error('[Collab] Kick member error:', error)
    return localizedErrorResponse(req, 'api.collab.kickFailed', 500)
  }
}
