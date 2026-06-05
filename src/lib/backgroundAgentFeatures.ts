/** v1.1.2 / v1.3 F3 — Background Agent UI + client. */

export interface BackgroundAgentFeatureStatus {
  enabled: boolean
  envExplicit: boolean
  cronHint: string
}

export function isBackgroundAgentEnabled(): boolean {
  return import.meta.env.VITE_BACKGROUND_AGENT === 'true'
}

export function getBackgroundAgentFeatureStatus(): BackgroundAgentFeatureStatus {
  const raw = import.meta.env.VITE_BACKGROUND_AGENT
  return {
    enabled: raw === 'true',
    envExplicit: raw === 'true' || raw === 'false',
    cronHint: '/api/jobs/process',
  }
}

/** E2E: localStorage + env override for stack tests. */
export function enableBackgroundAgentForSession(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ai-ide:feature:backgroundAgent', '1')
  }
}

export function isBackgroundAgentEnabledForSession(): boolean {
  if (isBackgroundAgentEnabled()) return true
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem('ai-ide:feature:backgroundAgent') === '1'
}
