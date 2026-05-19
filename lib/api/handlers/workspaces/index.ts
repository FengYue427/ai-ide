/**
 * Workspaces API — Prisma + JWT auth
 */
import { errorResponse, jsonResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import {
  countUserWorkspaces,
  getWorkspaceByName,
  listUserWorkspaces,
  upsertWorkspace,
} from '../../workspacesService'
import { getWorkspaceLimit } from '../../../billing/plans'
import { resolveUserPlanName } from '../../../billing/usageDb'

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
    const { name, files, settings } = await req.json()

    if (!name || typeof name !== 'string') {
      return errorResponse('工作区名称必填', 400)
    }

    const workspaceName = name.trim()
    if (!workspaceName) {
      return errorResponse('工作区名称无效', 400)
    }

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
