import { useCallback, useRef, useState } from 'react'
import type { ConfirmRequest, ToastKind, ToastMessage } from '../components/FeedbackCenter'

export function useAppFeedback() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const confirmResolverRef = useRef<((confirmed: boolean) => void) | null>(null)

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (kind: ToastKind, title: string, detail?: string) => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current.slice(-3), { id, kind, title, detail }])
      window.setTimeout(() => dismissToast(id), 3600)
    },
    [dismissToast],
  )

  const requestConfirm = useCallback((request: ConfirmRequest) => {
    setConfirmRequest(request)
    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve
    })
  }, [])

  const resolveConfirm = useCallback((confirmed: boolean) => {
    confirmResolverRef.current?.(confirmed)
    confirmResolverRef.current = null
    setConfirmRequest(null)
  }, [])

  return {
    toasts,
    confirmRequest,
    dismissToast,
    notify,
    requestConfirm,
    resolveConfirm,
  }
}
