/** OAuth buttons only when explicitly enabled (backend AUTH_* must also be set). */
export function isOAuthEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_OAUTH === 'true'
}

/** Forgot-password tab only when SMTP is wired (set VITE_ENABLE_PASSWORD_RESET=true). */
export function isForgotPasswordEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_PASSWORD_RESET === 'true'
}
