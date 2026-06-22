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
} from '../../projectSharesService'
import { getMaxSharesForPlan } from '../../../billing/entitlements'
import { resolveUserPlanName } from '../../../billing/usageDb'
import { requireEntitlementForUser } from '../../entitlementGuard'
import { shareFilesIncludeIntentSnapshot } from '../../shareIntentSnapshot'
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
      if (shareFilesIncludeIntentSnapshot(validated.files)) {
        const denied = await requireEntitlementForUser(req, user.id, 'intentShareImport')
        if (denied) return denied
      }

      const planName = await resolveUserPlanName(user.id)
      const shareLimit = getMaxSharesForPlan(planName)
      const used = await countUserProjectShares(user.id)
      if (used >= shareLimit) {
        return localizedErrorResponse(req, 'api.share.limitReached', 429, { limit: shareLimit })
      }
      const share = await createProjectShare(user.id, validated.files, { planName })
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
    }

    const share = await createProjectShare(null, validated.files)
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
