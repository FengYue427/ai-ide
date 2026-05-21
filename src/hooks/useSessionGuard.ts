import { useEffect } from 'react'
import type { ToastKind } from '../components/FeedbackCenter'
import { authService } from '../services/authService'
import { setApiUnauthorizedHandler } from '../services/apiUtils'
import { useIDEStore } from '../store/ideStore'

type NotifyFn = (kind: ToastKind, title: string, detail?: string) => void

/** Clear stale sessions on 401 and prompt re-login. */
export function useSessionGuard(notify: NotifyFn) {
  const setCurrentUser = useIDEStore((s) => s.setCurrentUser)
  const setShowAuthModal = useIDEStore((s) => s.setShowAuthModal)

  useEffect(() => {
    const onExpired = () => {
      setCurrentUser(null)
      setShowAuthModal(true)
      notify('info', '登录已过期', '请重新登录以继续同步工作区与订阅状态。')
    }

    authService.onSessionExpired(onExpired)
    setApiUnauthorizedHandler(() => {
      void authService.handleSessionExpired()
    })

    return () => {
      authService.onSessionExpired(null)
      setApiUnauthorizedHandler(null)
    }
  }, [notify, setCurrentUser, setShowAuthModal])
}
