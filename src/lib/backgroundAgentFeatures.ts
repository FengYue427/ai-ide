/** v1.1.2 / v1.3 F3 / v1.4 F5 — Background Agent UI + client. */

import { isBackgroundAgentProductionEnabled } from './v14Features'

export interface BackgroundAgentFeatureStatus {
  enabled: boolean
  envExplicit: boolean
  productionPolicy: boolean
  cronHint: string
}

export function isBackgroundAgentEnabled(): boolean {
  if (import.meta.env.VITE_BACKGROUND_AGENT === 'true') return true
  if (isBackgroundAgentProductionEnabled()) return true
  return isBackgroundAgentEnabledForSession()
}

export function getBackgroundAgentFeatureStatus(): BackgroundAgentFeatureStatus {
  const raw = import.meta.env.VITE_BACKGROUND_AGENT
  return {
    enabled: isBackgroundAgentEnabled(),
    envExplicit: raw === 'true' || raw === 'false',
    productionPolicy: isBackgroundAgentProductionEnabled(),
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
  if (import.meta.env.VITE_BACKGROUND_AGENT === 'true') return true
  if (isBackgroundAgentProductionEnabled()) return true
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem('ai-ide:feature:backgroundAgent') === '1'
}
