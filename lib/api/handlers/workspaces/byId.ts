/**
 * Single workspace API — lookup by workspace name (e.g. "default")
 */
import { errorResponse, jsonResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import { readJsonWithLimit } from '../../body'
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
const MAX_WORKSPACE_FILES = 200
const MAX_FILE_NAME_LEN = 200
const MAX_FILE_CONTENT_LEN = 200_000

function validateWorkspacePayload(files: unknown, settings: unknown): string | null {
  const filesStr = typeof files === 'string' ? files : null
  const settingsStr = typeof settings === 'string' ? settings : null

  if (filesStr && filesStr.length > MAX_WORKSPACE_BODY_BYTES) return 'files 字段过大'
  if (settingsStr && settingsStr.length > MAX_WORKSPACE_BODY_BYTES) return 'settings 字段过大'

  if (!filesStr && Array.isArray(files)) {
    if (files.length > MAX_WORKSPACE_FILES) return `文件数过多（最多 ${MAX_WORKSPACE_FILES}）`
    for (const item of files) {
      if (!item || typeof item !== 'object') return 'files 格式无效'
      const name = (item as any).name
      const content = (item as any).content
      if (typeof name !== 'string' || !name.trim() || name.length > MAX_FILE_NAME_LEN) return '文件名无效'
      if (typeof content !== 'string' || content.length > MAX_FILE_CONTENT_LEN) return '文件内容过大'
    }
  }

  if (!settingsStr && settings != null && typeof settings !== 'object') {
    return 'settings 格式无效'
  }

  return null
}

export async function GET(_req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(_req)
  if (!auth.ok) return auth.response

  const id = ctx?.params?.id
  if (!id) return errorResponse('缺少工作区名称', 400)

  try {
    const name = decodeURIComponent(id)
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

export async function PUT(req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const id = ctx?.params?.id
  if (!id) return errorResponse('缺少工作区名称', 400)

  try {
    const rate = await checkRateLimitDistributed(req, {
      ...resolveRateLimitOptions('workspaces:write'),
      suffix: auth.user.id,
    })
    if (!rate.allowed) return rateLimitErrorResponse(rate)

    const name = decodeURIComponent(id)
    const parsed = await readJsonWithLimit<{ files?: unknown; settings?: unknown; name?: unknown }>(
      req,
      MAX_WORKSPACE_BODY_BYTES,
      '工作区请求体过大',
    )
    if (!parsed.ok) return parsed.response

    const { files, settings, name: newName } = parsed.value

    const filesPayload =
      typeof files === 'string' ? files : JSON.stringify(files ?? [])
    const settingsPayload =
      typeof settings === 'string' ? settings : JSON.stringify(settings ?? {})

    const payloadError = validateWorkspacePayload(files, settings)
    if (payloadError) return errorResponse(payloadError, 413)

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

export async function DELETE(_req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(_req)
  if (!auth.ok) return auth.response

  const id = ctx?.params?.id
  if (!id) return errorResponse('缺少工作区名称', 400)

  try {
    const name = decodeURIComponent(id)

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
