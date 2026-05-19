/**
 * Single workspace API — lookup by workspace name (e.g. "default")
 */
import { errorResponse, jsonResponse } from '../../../lib/api/http'
import { requireAuth } from '../../../lib/api/requireAuth'
import {
  deleteWorkspaceByName,
  ensureDefaultWorkspace,
  getWorkspaceByName,
  serializeWorkspace,
  upsertWorkspace,
} from '../../../lib/api/workspacesService'

type RouteParams = { params: { id: string } }

export async function GET(_req: Request, { params }: RouteParams) {
  const auth = await requireAuth(_req)
  if (!auth.ok) return auth.response

  try {
    const name = decodeURIComponent(params.id)
    let workspace = await getWorkspaceByName(auth.user.id, name)

    if (!workspace && name === 'default') {
      workspace = await ensureDefaultWorkspace(auth.user.id)
    }

    if (!workspace) {
      return errorResponse('工作区不存在', 404)
    }

    return jsonResponse({ workspace: serializeWorkspace(workspace) })
  } catch (error) {
    console.error('[Workspaces] Load error:', error)
    return errorResponse('加载工作区失败', 500)
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const name = decodeURIComponent(params.id)
    const body = await req.json()
    const { files, settings, name: newName } = body

    const filesPayload =
      typeof files === 'string' ? files : JSON.stringify(files ?? [])
    const settingsPayload =
      typeof settings === 'string' ? settings : JSON.stringify(settings ?? {})

    const targetName = typeof newName === 'string' && newName.trim() ? newName.trim() : name

    const workspace = await upsertWorkspace(
      auth.user.id,
      targetName,
      filesPayload,
      settingsPayload,
    )

    return jsonResponse({
      success: true,
      workspace: serializeWorkspace(workspace),
    })
  } catch (error) {
    console.error('[Workspaces] Save error:', error)
    return errorResponse('保存工作区失败', 500)
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const auth = await requireAuth(_req)
  if (!auth.ok) return auth.response

  try {
    const name = decodeURIComponent(params.id)

    await deleteWorkspaceByName(auth.user.id, name)
    return jsonResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'DEFAULT_WORKSPACE_PROTECTED') {
      return errorResponse('默认工作区不能删除', 400)
    }
    console.error('[Workspaces] Delete error:', error)
    return errorResponse('删除工作区失败', 500)
  }
}
