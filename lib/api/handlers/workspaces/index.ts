/**
 * Workspaces API — Prisma + JWT auth
 */
import { jsonResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import { readJsonWithLimit } from '../../body'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { validateWorkspacePayload } from '../../workspacePayload'
import {
  countUserWorkspaces,
  getWorkspaceByName,
  listUserWorkspaces,
  upsertWorkspace,
} from '../../workspacesService'
import { getWorkspaceLimit } from '../../../billing/plans'
import { resolveUserPlanName } from '../../../billing/usageDb'
import { resolveRateLimitOptions } from '../../rateLimit'
import { checkRateLimitDistributed } from '../../rateLimitKv'
import { rateLimitErrorResponse } from '../../rateLimitResponse'

const MAX_WORKSPACE_BODY_BYTES = 2_000_000

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const workspaces = await listUserWorkspaces(auth.user.id)
    return jsonResponse({ workspaces })
  } catch (error) {
    console.error('[Workspaces] List error:', error)
    return localizedErrorResponse(req, 'api.workspace.listFailed', 500)
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const rate = await checkRateLimitDistributed(req, {
      ...resolveRateLimitOptions('workspaces:write'),
      suffix: auth.user.id,
    })
    if (!rate.allowed) return rateLimitErrorResponse(req, rate)

    const parsed = await readJsonWithLimit<{ name?: unknown; files?: unknown; settings?: unknown }>(
      req,
      MAX_WORKSPACE_BODY_BYTES,
    )
    if (!parsed.ok) return parsed.response

    const { name, files, settings } = parsed.value

    if (!name || typeof name !== 'string') {
      return localizedErrorResponse(req, 'api.workspace.nameRequired', 400)
    }

    const workspaceName = name.trim()
    if (!workspaceName) {
      return localizedErrorResponse(req, 'api.workspace.nameInvalid', 400)
    }

    const payloadError = validateWorkspacePayload(files, settings)
    if (payloadError) {
      return localizedErrorResponse(req, payloadError.key, 413, payloadError.params)
    }

    const existing = await getWorkspaceByName(auth.user.id, workspaceName)
    if (!existing) {
      const planName = await resolveUserPlanName(auth.user.id)
      const workspaceLimit = getWorkspaceLimit(planName)
      if (workspaceLimit !== -1) {
        const used = await countUserWorkspaces(auth.user.id)
        if (used >= workspaceLimit) {
          return localizedErrorResponse(req, 'api.workspace.limitReached', 429, {
            limit: workspaceLimit,
          })
        }
      }
    }

    const workspace = await upsertWorkspace(
      auth.user.id,
      workspaceName,
      typeof files === 'string' ? files : JSON.stringify(files ?? []),
      typeof settings === 'string' ? settings : JSON.stringify(settings ?? {}),
    )

    return jsonResponse(
      appendApiMessage(req, 'api.workspace.created', {
        success: true,
        workspace: {
          id: workspace.name,
          name: workspace.name,
          isDefault: workspace.isDefault,
          updatedAt: workspace.updatedAt.toISOString(),
        },
      }),
    )
  } catch (error) {
    console.error('[Workspaces] Create error:', error)
    return localizedErrorResponse(req, 'api.workspace.createFailed', 500)
  }
}
