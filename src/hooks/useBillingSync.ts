import { useEffect } from 'react'
import { BILLING_SYNC_EVENT, syncBillingFromServer } from '../services/billingSync'
import { useIDEStore } from '../store/ideStore'

/**
 * Keep ideStore.currentPlan aligned with /api/subscription after login, payment return, or tab focus.
 */
export function useBillingSync() {
  const currentUser = useIDEStore((s) => s.currentUser)
  const authChecked = useIDEStore((s) => s.authChecked)

  useEffect(() => {
    if (!authChecked || !currentUser) return
    void syncBillingFromServer()
  }, [authChecked, currentUser?.id])

  useEffect(() => {
    const onFocus = () => {
      if (!useIDEStore.getState().currentUser) return
      void syncBillingFromServer()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])
}

export { BILLING_SYNC_EVENT }
