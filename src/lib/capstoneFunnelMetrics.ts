const METRICS_KEY = 'aide.capstone.funnel.metrics'

export type CapstoneFunnelMetricStep =
  | 'welcome_click'
  | 'created'
  | 'auto_launch'
  | 'review-spec'
  | 'run-tasks'
  | 'check-acceptance'
  | 'completed'

export const CAPSTONE_FUNNEL_METRIC_ORDER: readonly CapstoneFunnelMetricStep[] = [
  'welcome_click',
  'created',
  'auto_launch',
  'run-tasks',
  'check-acceptance',
  'completed',
] as const

export interface CapstoneFunnelMetrics {
  specSlug: string
  steps: Partial<Record<CapstoneFunnelMetricStep, string>>
}

export function readCapstoneFunnelMetrics(): CapstoneFunnelMetrics | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(METRICS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CapstoneFunnelMetrics
    if (!parsed?.specSlug) return null
    return parsed
  } catch {
    return null
  }
}

export function resetCapstoneFunnelMetrics(specSlug: string): void {
  if (typeof localStorage === 'undefined') return
  const state: CapstoneFunnelMetrics = { specSlug, steps: {} }
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

export function recordCapstoneFunnelMetric(
  step: CapstoneFunnelMetricStep,
  specSlug?: string,
): void {
  if (typeof localStorage === 'undefined') return
  const existing = readCapstoneFunnelMetrics()
  const slug = specSlug ?? existing?.specSlug
  if (!slug) return

  const next: CapstoneFunnelMetrics = {
    specSlug: slug,
    steps: {
      ...(existing?.specSlug === slug ? existing.steps : {}),
      [step]: new Date().toISOString(),
    },
  }
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(next))
  } catch {
    // ignore quota errors
  }
}

export function summarizeCapstoneFunnelMetrics(metrics: CapstoneFunnelMetrics | null): {
  completed: number
  total: number
  percent: number
  lastStep: CapstoneFunnelMetricStep | null
} {
  if (!metrics) return { completed: 0, total: CAPSTONE_FUNNEL_METRIC_ORDER.length, percent: 0, lastStep: null }
  const completed = CAPSTONE_FUNNEL_METRIC_ORDER.filter((step) => Boolean(metrics.steps[step])).length
  const total = CAPSTONE_FUNNEL_METRIC_ORDER.length
  const lastStep =
    [...CAPSTONE_FUNNEL_METRIC_ORDER].reverse().find((step) => Boolean(metrics.steps[step])) ?? null
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    lastStep,
  }
}
