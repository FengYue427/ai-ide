/** OAuth buttons only when explicitly enabled (backend AUTH_* must also be set). */
export function isOAuthEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_OAUTH === 'true'
}
