/**
 * Update collaboration member role (host only, v1.1.3 F3)
 */
import { jsonResponse } from '../../../http'
import { requireAuth } from '../../../requireAuth'
import { readJsonWithLimit } from '../../../body'
import { appendApiMessage, localizedErrorResponse } from '../../../localizedError'
import {
  buildCollabSignalingForUser,
  updateCollaborationMemberRole,
  serializeCollabRoom,
} from '../../../collaborationRoomsService'

const MAX_BODY_BYTES = 2_000

export async function PATCH(req: Request, ctx?: { params: Record<string, string> }) {
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
    const parsed = await readJsonWithLimit<{ role?: unknown }>(req, MAX_BODY_BYTES)
    if (!parsed.ok) return parsed.response

    const role = typeof parsed.value.role === 'string' ? parsed.value.role.trim().toLowerCase() : ''
    if (role !== 'editor' && role !== 'viewer') {
      return localizedErrorResponse(req, 'api.collab.invalidRole', 400)
    }

    const result = await updateCollaborationMemberRole(
      auth.user.id,
      code,
      targetUserId,
      role,
    )
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
      appendApiMessage(req, 'api.collab.roleUpdated', {
        room: serializeCollabRoom(result.room, result.members, signaling),
      }),
    )
  } catch (error) {
    console.error('[Collab] Update member role error:', error)
    return localizedErrorResponse(req, 'api.collab.roleUpdateFailed', 500)
  }
}
