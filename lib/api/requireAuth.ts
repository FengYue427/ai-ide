import { getTokenFromRequest, verifyJWT } from '../../src/lib/jwt'
import { prisma } from '../../src/lib/prisma'
import { errorResponse } from './http'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  image: string | null
}

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: Response }

/** Require valid JWT session; returns user or 401 Response. */
export async function requireAuth(req: Request): Promise<AuthResult> {
  const token = getTokenFromRequest(req)
  if (!token) {
    return { ok: false, response: errorResponse('未登录', 401) }
  }

  const payload = verifyJWT(token)
  if (!payload?.userId) {
    return { ok: false, response: errorResponse('会话无效或已过期', 401) }
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, image: true },
  })

  if (!user) {
    return { ok: false, response: errorResponse('用户不存在', 401) }
  }

  return { ok: true, user }
}

/** Optional auth — returns user or null without error response. */
export async function optionalAuth(req: Request): Promise<AuthUser | null> {
  const token = getTokenFromRequest(req)
  if (!token) return null

  const payload = verifyJWT(token)
  if (!payload?.userId) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, image: true },
  })

  return user
}
