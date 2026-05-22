/**
 * Single workspace API — lookup by workspace name (e.g. "default")
 */
import { jsonResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import { readJsonWithLimit } from '../../body'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { validateWorkspacePayload } from '../../workspacePayload'
import {
  deleteWorkspaceByName,
  ensureDefaultWorkspace,
  getWorkspaceByName,
  serializeWorkspace,
  upsertWorkspace,
} from '../../workspacesService'
import { resolveRateLimitOptions } from '../../rateLimit'
import { checkRateLimitDistributed } from '../../rateLimitKv'
import { rateLimitErrorResponse } from '../../rateLimitResponse'

const MAX_WORKSPACE_BODY_BYTES = 2_000_000

export async function GET(req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const id = ctx?.params?.id
  if (!id) return localizedErrorResponse(req, 'api.workspace.nameRequired', 400)

  try {
    const name = decodeURIComponent(id)
    let workspace = await getWorkspaceByName(auth.user.id, name)

    if (!workspace && name === 'default') {
      workspace = await ensureDefaultWorkspace(auth.user.id)
    }

    if (!workspace) {
      return localizedErrorResponse(req, 'api.workspace.notFound', 404)
    }

    return jsonResponse({ workspace: serializeWorkspace(workspace) })
  } catch (error) {
    console.error('[Workspaces] Load error:', error)
    return localizedErrorResponse(req, 'api.workspace.loadFailed', 500)
  }
}

export async function PUT(req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const id = ctx?.params?.id
  if (!id) return localizedErrorResponse(req, 'api.workspace.nameRequired', 400)

  try {
    const rate = await checkRateLimitDistributed(req, {
      ...resolveRateLimitOptions('workspaces:write'),
      suffix: auth.user.id,
    })
    if (!rate.allowed) return rateLimitErrorResponse(req, rate)

    const name = decodeURIComponent(id)
    const parsed = await readJsonWithLimit<{ files?: unknown; settings?: unknown; name?: unknown }>(
      req,
      MAX_WORKSPACE_BODY_BYTES,
    )
    if (!parsed.ok) return parsed.response

    const { files, settings, name: newName } = parsed.value

    const filesPayload =
      typeof files === 'string' ? files : JSON.stringify(files ?? [])
    const settingsPayload =
      typeof settings === 'string' ? settings : JSON.stringify(settings ?? {})

    const payloadError = validateWorkspacePayload(files, settings)
    if (payloadError) {
      return localizedErrorResponse(req, payloadError.key, 413, payloadError.params)
    }

    const targetName = typeof newName === 'string' && newName.trim() ? newName.trim() : name

    const workspace = await upsertWorkspace(
      auth.user.id,
      targetName,
      filesPayload,
      settingsPayload,
    )

    return jsonResponse(
      appendApiMessage(req, 'api.workspace.saved', {
        success: true,
        workspace: serializeWorkspace(workspace),
      }),
    )
  } catch (error) {
    console.error('[Workspaces] Save error:', error)
    return localizedErrorResponse(req, 'api.workspace.saveFailed', 500)
  }
}

export async function DELETE(req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const id = ctx?.params?.id
  if (!id) return localizedErrorResponse(req, 'api.workspace.nameRequired', 400)

  try {
    const name = decodeURIComponent(id)

    await deleteWorkspaceByName(auth.user.id, name)
    return jsonResponse(appendApiMessage(req, 'api.workspace.deleted', { success: true }))
  } catch (error) {
    if (error instanceof Error && error.message === 'DEFAULT_WORKSPACE_PROTECTED') {
      return localizedErrorResponse(req, 'api.workspace.defaultCannotDelete', 400)
    }
    console.error('[Workspaces] Delete error:', error)
    return localizedErrorResponse(req, 'api.workspace.deleteFailed', 500)
  }
}
