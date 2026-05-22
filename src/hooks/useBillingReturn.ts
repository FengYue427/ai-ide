import { useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService'
import { useIDEStore } from '../store/ideStore'
import type { ToastKind } from '../components/FeedbackCenter'
import type { TranslateFn } from '../i18n'

export function useBillingReturn(
  notify: (kind: ToastKind, title: string, detail?: string) => void,
  t: TranslateFn,
) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('subscription')
    const plan = params.get('plan')

    if (!status) return

    const cleanUrl = () => {
      params.delete('subscription')
      params.delete('plan')
      const query = params.toString()
      const next = `${window.location.pathname}${query ? `?${query}` : ''}`
      window.history.replaceState({}, '', next)
    }

    const applyPlan = (sub: Awaited<ReturnType<typeof subscriptionService.getSubscription>>) => {
      useIDEStore.getState().setCurrentPlan(sub.plan)
      subscriptionService.subscribeToPlan(sub.plan)
      return sub
    }

    void (async () => {
      if (status === 'success') {
        const sub = applyPlan(await subscriptionService.refreshAfterCheckout(plan))
        const label = plan || sub.plan
        const detail =
          plan && sub.plan !== plan
            ? t('notify.subscriptionSyncing', { plan: sub.plan })
            : t('notify.subscriptionCurrentPlan', { plan: label })
        notify(sub.plan === 'free' && plan ? 'info' : 'success', t('notify.subscriptionSuccess'), detail)
      } else if (status === 'canceled') {
        notify('info', t('notify.subscriptionCanceled'), t('notify.subscriptionCanceledDetail'))
      } else if (status === 'portal_return') {
        applyPlan(await subscriptionService.refreshAfterCheckout())
        notify('success', t('notify.subscriptionUpdated'))
      }
      cleanUrl()
    })()
  }, [notify, t])
}
