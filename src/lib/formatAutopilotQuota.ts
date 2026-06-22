import type { AutopilotQuota } from '../services/autopilotUsageService'
import type { TranslateFn } from '../i18n'

export function formatAutopilotQuotaLabel(quota: AutopilotQuota, t: TranslateFn): string {
  if (quota.unlimited || quota.limit < 0) {
    return t('autopilot.quota.unlimited')
  }
  if (!quota.allowed && quota.remaining <= 0) {
    return t('autopilot.quota.blocked', { used: quota.used, limit: quota.limit })
  }
  return t('autopilot.quota.remaining', {
    used: quota.used,
    limit: quota.limit,
    remaining: quota.remaining,
  })
}
