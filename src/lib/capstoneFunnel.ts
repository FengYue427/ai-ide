import type { SpecAcceptanceLinkage } from './specAcceptanceLinkage'
import { recordCapstoneFunnelMetric } from './capstoneFunnelMetrics'

const STORAGE_KEY = 'aide.capstone.funnel'

export interface CapstoneFunnelState {
  specSlug: string
  startedAt: string
}

export type CapstoneFunnelStep = 'review-spec' | 'run-tasks' | 'check-acceptance'

export function startCapstoneFunnel(specSlug: string): void {
  if (typeof localStorage === 'undefined') return
  const state: CapstoneFunnelState = {
    specSlug,
    startedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

export function readCapstoneFunnel(): CapstoneFunnelState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CapstoneFunnelState
    if (!parsed?.specSlug) return null
    return parsed
  } catch {
    return null
  }
}

export function clearCapstoneFunnel(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function resolveCapstoneFunnelStep(
  funnel: CapstoneFunnelState | null,
  linkage: SpecAcceptanceLinkage,
  activeSpecSlug: string | null,
): CapstoneFunnelStep | null {
  if (!funnel) return null
  if (linkage.readyForProof) {
    recordCapstoneFunnelMetric('completed', funnel.specSlug)
    clearCapstoneFunnel()
    return null
  }

  const slug = linkage.activeSpecSlug ?? activeSpecSlug
  if (!slug || slug !== funnel.specSlug) return null

  if (linkage.openTaskCount > 0) return 'run-tasks'
  if (linkage.openAcceptanceCount > 0) return 'check-acceptance'
  return 'review-spec'
}
