import { useIDEStore } from '../store/ideStore'
import { clearServerQuotaCache } from './usageService'
import { subscriptionService, type Subscription } from './subscriptionService'

export const BILLING_SYNC_EVENT = 'ai-ide:billing-sync'
export const BILLING_SUCCESS_KEY = 'aide_billing_success'
export const ALIPAY_PENDING_KEY = 'aide_alipay_pending'

/** Load subscription from API → ideStore + subscriptionService; invalidate quota cache. */
export async function syncBillingFromServer(
  expectedPlan?: string | null,
): Promise<Subscription> {
  const prevPlan = useIDEStore.getState().currentPlan
  const fetched = expectedPlan
    ? { subscription: await subscriptionService.refreshAfterCheckout(expectedPlan) }
    : await subscriptionService.getSubscription()

  const sub = fetched.subscription
  const plan = sub.plan || 'free'
  useIDEStore.getState().setCurrentPlan(plan)
  subscriptionService.subscribeToPlan(plan)
  clearServerQuotaCache()

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(BILLING_SYNC_EVENT, {
        detail: {
          plan,
          notice: fetched.notice,
          previousPlan: prevPlan,
          message: fetched.message,
        },
      }),
    )
  }

  return sub
}
