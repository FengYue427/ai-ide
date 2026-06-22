import { trackEvent } from './observability'
import { recordCapstoneFunnelMetric, type CapstoneFunnelMetricStep } from './capstoneFunnelMetrics'

const CAPSTONE_METRIC_STEPS = new Set<CapstoneFunnelMetricStep>([
  'welcome_click',
  'created',
  'auto_launch',
  'review-spec',
  'run-tasks',
  'check-acceptance',
  'completed',
])

export type ConversionSource =
  | 'toolbar'
  | 'welcome'
  | 'activity-line'
  | 'settings'
  | 'upgrade-hint'
  | 'autopilot'
  | 'plan-batch'
  | 'share'
  | 'capstone-funnel'
  | 'billing-return'
  | 'unknown'

export function trackSubscriptionModalOpen(source: ConversionSource, extra?: Record<string, unknown>): void {
  trackEvent('conversion.subscription_modal_open', { source, ...extra })
}

export function trackUpgradeClick(source: ConversionSource, extra?: Record<string, unknown>): void {
  trackEvent('conversion.upgrade_click', { source, ...extra })
}

export function trackCapstoneFunnelStep(
  step: string,
  extra?: Record<string, unknown>,
): void {
  trackEvent('conversion.capstone_funnel', { step, ...extra })
  if (CAPSTONE_METRIC_STEPS.has(step as CapstoneFunnelMetricStep)) {
    const specSlug = typeof extra?.specSlug === 'string' ? extra.specSlug : undefined
    recordCapstoneFunnelMetric(step as CapstoneFunnelMetricStep, specSlug)
  }
}
