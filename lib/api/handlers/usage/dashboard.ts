/**
 * Platform AI usage dashboard — read-only (authenticated).
 */
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { requireAuth } from '../../requireAuth'
import { isPlatformAiConfigured, resolvePlatformAiRoute } from '../../aiGateway/platformConfig'
import { buildPlatformUsageDashboard } from '../../../billing/usageDashboard'
import { buildDashboardEntitlements } from '../../../billing/dashboardEntitlements'
import { getEffectiveEntitlements } from '../../../billing/entitlements'
import { getAutopilotQuotaForUser } from '../../../billing/autopilotUsage'
import {
  AI_USAGE_PLATFORM_TYPE,
  AI_USAGE_TYPE,
  buildQuotaSnapshot,
  getAiUsageCountToday,
  getAiUsageDailyBuckets,
  getUsageCountForDay,
  resolveUserPlanName,
} from '../../../billing/usageDb'

const DASHBOARD_DAYS = 7

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const plan = await resolveUserPlanName(auth.user.id)
    const used = await getAiUsageCountToday(auth.user.id)
    const platformToday = await getUsageCountForDay(auth.user.id, [AI_USAGE_PLATFORM_TYPE], 0)
    const otherToday = await getUsageCountForDay(auth.user.id, [AI_USAGE_TYPE], 0)
    const daily = await getAiUsageDailyBuckets(auth.user.id, DASHBOARD_DAYS)
    const quota = buildQuotaSnapshot(plan, used)
    const autopilotQuota = await getAutopilotQuotaForUser(auth.user.id)
    const entitlements = buildDashboardEntitlements(plan, getEffectiveEntitlements(plan), {
      aiQuota: quota,
      autopilotQuota,
    })

    const platformRoute = resolvePlatformAiRoute()
    const platformProvider =
      isPlatformAiConfigured() && platformRoute.ok ? platformRoute.route.provider : undefined

    return jsonResponse(
      buildPlatformUsageDashboard({
        quota,
        platformToday,
        otherToday,
        daily,
        periodDays: DASHBOARD_DAYS,
        platformProvider,
        entitlements,
      }),
    )
  } catch (error) {
    console.error('[Usage Dashboard GET] error:', error)
    return localizedErrorResponse(req, 'api.usage.readFailed', 500)
  }
}
