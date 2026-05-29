/**
 * Leave collaboration room (v1.1.3 F2)
 */
import { jsonResponse } from '../../../http'
import { requireAuth } from '../../../requireAuth'
import { appendApiMessage, localizedErrorResponse } from '../../../localizedError'
import { leaveCollaborationRoom } from '../../../collaborationRoomsService'

export async function POST(req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const code = ctx?.params?.code?.trim().toLowerCase()
  if (!code) {
    return localizedErrorResponse(req, 'api.collab.codeRequired', 400)
  }

  try {
    const result = await leaveCollaborationRoom(auth.user.id, code)
    if (!result.ok) {
      if (result.reason === 'not_found') {
        return localizedErrorResponse(req, 'api.collab.roomNotFound', 404)
      }
      return localizedErrorResponse(req, 'api.collab.notMember', 403)
    }

    return jsonResponse(appendApiMessage(req, 'api.collab.left', { success: true }))
  } catch (error) {
    console.error('[Collab] Leave room error:', error)
    return localizedErrorResponse(req, 'api.collab.leaveFailed', 500)
  }
}
