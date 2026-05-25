import { useEffect, useRef } from 'react'
import { ALIPAY_PENDING_KEY, BILLING_SUCCESS_KEY, syncBillingFromServer } from '../services/billingSync'
import { readJsonResponse } from '../services/apiUtils'
import { useIDEStore } from '../store/ideStore'
import type { ToastKind } from '../components/FeedbackCenter'
import type { TranslateFn } from '../i18n'

const ALIPAY_RETURN_METHOD = 'alipay.trade.page.pay.return'

function collectSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search)
}

function isAlipaySyncReturn(params: URLSearchParams): boolean {
  return params.get('method') === ALIPAY_RETURN_METHOD && Boolean(params.get('out_trade_no')?.trim())
}

function markPaySuccess(plan: string) {
  sessionStorage.setItem(BILLING_SUCCESS_KEY, plan)
  useIDEStore.getState().setShowSubscriptionModal(true)
}

export function useBillingReturn(
  notify: (kind: ToastKind, title: string, detail?: string) => void,
  t: TranslateFn,
) {
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) return

    const params = collectSearchParams()
    const status = params.get('subscription')
    const plan = params.get('plan')
    const alipayReturn = isAlipaySyncReturn(params)

    if (!status && !alipayReturn) return

    handledRef.current = true

    const cleanUrl = () => {
      window.history.replaceState({}, '', window.location.pathname)
    }

    void (async () => {
      if (alipayReturn) {
        sessionStorage.removeItem(ALIPAY_PENDING_KEY)
        try {
          const res = await fetch('/api/payment/alipay/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              returnQuery: window.location.search,
            }),
          })
          const data = await readJsonResponse<{
            subscription?: { plan: string }
            fulfilled?: boolean
            error?: string
          }>(res)

          const resolvedPlan = plan || data?.subscription?.plan || 'pro'
          const sub = await syncBillingFromServer(resolvedPlan)

          if (!res.ok) {
            notify('error', t('notify.subscriptionSuccess'), data?.error || t('subscription.payFailed'))
          } else if (sub.plan === 'free') {
            notify(
              'info',
              t('notify.subscriptionSuccess'),
              t('notify.subscriptionSyncing', { plan: resolvedPlan }),
            )
          } else {
            notify(
              'success',
              t('notify.subscriptionSuccess'),
              t('notify.subscriptionCurrentPlan', { plan: sub.plan }),
            )
            markPaySuccess(sub.plan)
          }
        } catch {
          notify('error', t('subscription.payFailed'), t('notify.subscriptionSyncing', { plan: plan || 'pro' }))
          const sub = await syncBillingFromServer(plan || 'pro')
          if (sub.plan !== 'free') markPaySuccess(sub.plan)
        }
        cleanUrl()
        return
      }

      if (status === 'success') {
        const sub = await syncBillingFromServer(plan)
        const label = plan || sub.plan
        const detail =
          plan && sub.plan !== plan
            ? t('notify.subscriptionSyncing', { plan: sub.plan })
            : t('notify.subscriptionCurrentPlan', { plan: label })
        notify(sub.plan === 'free' && plan ? 'info' : 'success', t('notify.subscriptionSuccess'), detail)
        if (sub.plan !== 'free') markPaySuccess(sub.plan)
      } else if (status === 'canceled') {
        notify('info', t('notify.subscriptionCanceled'), t('notify.subscriptionCanceledDetail'))
      } else if (status === 'portal_return') {
        await syncBillingFromServer()
        notify('success', t('notify.subscriptionUpdated'))
      }
      cleanUrl()
    })()
  }, [notify, t])
}
