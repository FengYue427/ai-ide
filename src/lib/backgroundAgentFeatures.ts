/** v1.1.2 — Background Agent UI + client (default off until GA). */
export function isBackgroundAgentEnabled(): boolean {
  return import.meta.env.VITE_BACKGROUND_AGENT === 'true'
}
