import jwt from 'jsonwebtoken'

const FALLBACK_SECRET = 'your-fallback-secret-key-change-in-production'

function resolveJwtSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim()
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be set in production')
  }
  return FALLBACK_SECRET
}

/** Lazy — avoid crashing api/index cold start before handlers run (Vercel smoke). */
let jwtSecret: string | undefined

function getJwtSecret(): string {
  if (!jwtSecret) jwtSecret = resolveJwtSecret()
  return jwtSecret
}

export function isAuthSecretConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET?.trim())
}

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
    getJwtSecret(),
    { expiresIn: '7d' }
  )
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload
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
