import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.AUTH_SECRET || 'your-fallback-secret-key-change-in-production'

export interface JWTPayload {
  userId: string
  email: string
  name?: string | null
  iat?: number
  exp?: number
}

export function createJWT(user: { id: string; email: string; name?: string | null }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch {
    return null
  }
}

export function getTokenFromRequest(req: Request): string | null {
  // 从 Cookie 获取
  const cookie = req.headers.get('cookie')
  if (cookie) {
    const match = cookie.match(/auth-token=([^;]+)/)
    if (match) return match[1]
  }
  
  // 从 Authorization Header 获取
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7)
  }
  
  return null
}
