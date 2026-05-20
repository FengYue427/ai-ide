/**
 * Workspaces API — Prisma + JWT auth
 */
import { errorResponse, jsonResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import { readJsonWithLimit } from '../../body'
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

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const workspaces = await listUserWorkspaces(auth.user.id)
    return jsonResponse({ workspaces })
  } catch (error) {
    console.error('[Workspaces] List error:', error)
    return errorResponse('获取工作区列表失败', 500)
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
    if (!rate.allowed) return rateLimitErrorResponse(rate)

    const parsed = await readJsonWithLimit<{ name?: unknown; files?: unknown; settings?: unknown }>(
      req,
      MAX_WORKSPACE_BODY_BYTES,
      '工作区请求体过大',
    )
    if (!parsed.ok) return parsed.response

    const { name, files, settings } = parsed.value

    if (!name || typeof name !== 'string') {
      return errorResponse('工作区名称必填', 400)
    }

    const workspaceName = name.trim()
    if (!workspaceName) {
      return errorResponse('工作区名称无效', 400)
    }

    const payloadError = validateWorkspacePayload(files, settings)
    if (payloadError) return errorResponse(payloadError, 413)

    const existing = await getWorkspaceByName(auth.user.id, workspaceName)
    if (!existing) {
      const planName = await resolveUserPlanName(auth.user.id)
      const workspaceLimit = getWorkspaceLimit(planName)
      if (workspaceLimit !== -1) {
        const used = await countUserWorkspaces(auth.user.id)
        if (used >= workspaceLimit) {
          return errorResponse(
            `当前计划最多 ${workspaceLimit} 个云工作区，请升级专业版或团队版`,
            429,
          )
        }
      }
    }

    const workspace = await upsertWorkspace(
      auth.user.id,
      workspaceName,
      typeof files === 'string' ? files : JSON.stringify(files ?? []),
      typeof settings === 'string' ? settings : JSON.stringify(settings ?? {}),
    )

    return jsonResponse({
      success: true,
      workspace: {
        id: workspace.name,
        name: workspace.name,
        isDefault: workspace.isDefault,
        updatedAt: workspace.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[Workspaces] Create error:', error)
    return errorResponse('创建工作区失败', 500)
  }
}
