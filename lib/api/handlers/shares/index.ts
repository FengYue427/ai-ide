/**
 * Project share snapshots — create + list (auth optional on create)
 */
import { jsonResponse } from '../../http'
import { optionalAuth, requireAuth } from '../../requireAuth'
import { readJsonWithLimit } from '../../body'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { validateSharePayload, MAX_SHARE_BODY_BYTES } from '../../sharePayload'
import {
  countUserProjectShares,
  createProjectShare,
  listProjectSharesForUser,
  MAX_SHARES_PER_USER,
} from '../../projectSharesService'
import { resolveRateLimitOptions } from '../../rateLimit'
import { checkRateLimitDistributed } from '../../rateLimitKv'
import { rateLimitErrorResponse } from '../../rateLimitResponse'

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const shares = await listProjectSharesForUser(auth.user.id)
    return jsonResponse({
      shares: shares.map((share) => ({
        slug: share.slug,
        fileCount: share.files.length,
        createdAt: share.createdAt.toISOString(),
        expiresAt: share.expiresAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('[Share] List error:', error)
    return localizedErrorResponse(req, 'api.share.listFailed', 500)
  }
}

export async function POST(req: Request) {
  const user = await optionalAuth(req)

  try {
    const rate = await checkRateLimitDistributed(req, {
      ...resolveRateLimitOptions('shares:create'),
      suffix: user?.id ?? 'anon',
    })
    if (!rate.allowed) return rateLimitErrorResponse(req, rate)

    const parsed = await readJsonWithLimit<{ files?: unknown }>(req, MAX_SHARE_BODY_BYTES + 8_000)
    if (!parsed.ok) return parsed.response

    const validated = validateSharePayload(parsed.value.files)
    if (!validated.ok) {
      return localizedErrorResponse(req, validated.key, 400)
    }

    if (user) {
      const used = await countUserProjectShares(user.id)
      if (used >= MAX_SHARES_PER_USER) {
        return localizedErrorResponse(req, 'api.share.limitReached', 429, { limit: MAX_SHARES_PER_USER })
      }
    }

    const share = await createProjectShare(user?.id ?? null, validated.files)
    return jsonResponse(
      appendApiMessage(req, 'api.share.created', {
        share: {
          slug: share.slug,
          fileCount: share.files.length,
          createdAt: share.createdAt.toISOString(),
          expiresAt: share.expiresAt.toISOString(),
        },
      }),
      201,
    )
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : 'unknown'
    console.error('[Share] Create error:', code, error)
    if (code === 'P2021') {
      return localizedErrorResponse(req, 'api.share.createFailed', 503)
    }
    return localizedErrorResponse(req, 'api.share.createFailed', 500)
  }
}
