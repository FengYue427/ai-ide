import { useEffect, useState } from 'react'
import { isPublicWelfareClient } from '../lib/publicWelfare'
import { readJsonResponse } from '../services/apiUtils'

/** Build-time flag or live /api/subscription/payment-methods.publicWelfare */
export function usePublicWelfare(): boolean {
  const [fromServer, setFromServer] = useState(false)

  useEffect(() => {
    if (isPublicWelfareClient()) return
    let cancelled = false
    fetch('/api/subscription/payment-methods', { credentials: 'include' })
      .then((r) => readJsonResponse<{ publicWelfare?: boolean }>(r))
      .then((data) => {
        if (!cancelled && data?.publicWelfare) setFromServer(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return isPublicWelfareClient() || fromServer
}
