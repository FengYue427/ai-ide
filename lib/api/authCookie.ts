/** HttpOnly session cookie for JWT auth (register / login / signout). */
export function buildAuthSetCookie(token: string, maxAgeSeconds = 604800): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`
}

export function buildAuthClearCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `auth-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

/** Clear Auth.js session cookies when OAuth was used. */
export function buildOAuthClearCookies(): string[] {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  const base = `Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  return [
    `authjs.session-token=; ${base}`,
    `__Secure-authjs.session-token=; ${base}`,
    `authjs.csrf-token=; ${base}`,
  ]
}

export function buildAllAuthClearCookies(): string[] {
  return [buildAuthClearCookie(), ...buildOAuthClearCookies()]
}
