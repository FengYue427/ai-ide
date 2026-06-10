/**
 * Project share by slug — public read, owner delete
 */
import { jsonResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { deleteProjectShare, getProjectShareBySlug } from '../../projectSharesService'

export async function GET(req: Request, ctx?: { params: Record<string, string> }) {
  const slug = ctx?.params?.slug?.trim()
  if (!slug) {
    return localizedErrorResponse(req, 'api.share.slugRequired', 400)
  }

  try {
    const share = await getProjectShareBySlug(slug)
    if (!share) {
      return localizedErrorResponse(req, 'api.share.notFound', 404)
    }

    return jsonResponse({
      share: {
        slug: share.slug,
        files: share.files,
        createdAt: share.createdAt.toISOString(),
        expiresAt: share.expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[Share] Load error:', error)
    return localizedErrorResponse(req, 'api.share.loadFailed', 500)
  }
}

export async function DELETE(req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const slug = ctx?.params?.slug?.trim()
  if (!slug) {
    return localizedErrorResponse(req, 'api.share.slugRequired', 400)
  }

  try {
    const deleted = await deleteProjectShare(slug, auth.user.id)
    if (!deleted) {
      return localizedErrorResponse(req, 'api.share.notFound', 404)
    }
    return jsonResponse(appendApiMessage(req, 'api.share.deleted', { slug }))
  } catch (error) {
    console.error('[Share] Delete error:', error)
    return localizedErrorResponse(req, 'api.share.deleteFailed', 500)
  }
}
