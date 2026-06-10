/** Optional client flag; live providers come from /api/auth/oauth/providers. */
export function isOAuthEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_OAUTH === 'true'
}

/** Forgot-password tab only when SMTP is wired (set VITE_ENABLE_PASSWORD_RESET=true). */
export function isForgotPasswordEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_PASSWORD_RESET === 'true'
}
