import { useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService'
import { useIDEStore } from '../store/ideStore'
import type { ToastKind } from '../components/FeedbackCenter'

export function useBillingReturn(notify: (kind: ToastKind, title: string, detail?: string) => void) {
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
            ? `支付已完成，计划同步中（当前显示：${sub.plan}）。若未更新请刷新页面。`
            : `当前计划：${label}`
        notify(sub.plan === 'free' && plan ? 'info' : 'success', '订阅成功', detail)
      } else if (status === 'canceled') {
        notify('info', '结账已取消', '你仍可继续使用当前计划。')
      } else if (status === 'portal_return') {
        applyPlan(await subscriptionService.refreshAfterCheckout())
        notify('success', '订阅信息已更新')
      }
      cleanUrl()
    })()
  }, [notify])
}
