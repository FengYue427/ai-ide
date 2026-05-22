import { useEffect } from 'react'
import type { ToastKind } from '../components/FeedbackCenter'
import type { TranslateFn } from '../i18n'
import { authService } from '../services/authService'
import { setApiUnauthorizedHandler } from '../services/apiUtils'
import { useIDEStore } from '../store/ideStore'

type NotifyFn = (kind: ToastKind, title: string, detail?: string) => void

/** Clear stale sessions on 401 and prompt re-login. */
export function useSessionGuard(notify: NotifyFn, t: TranslateFn) {
  const setCurrentUser = useIDEStore((s) => s.setCurrentUser)
  const setShowAuthModal = useIDEStore((s) => s.setShowAuthModal)

  useEffect(() => {
    const onExpired = () => {
      setCurrentUser(null)
      setShowAuthModal(true)
      notify('info', t('notify.sessionExpired'), t('notify.sessionExpiredDetail'))
    }

    authService.onSessionExpired(onExpired)
    setApiUnauthorizedHandler(() => {
      void authService.handleSessionExpired()
    })

    return () => {
      authService.onSessionExpired(null)
      setApiUnauthorizedHandler(null)
    }
  }, [notify, setCurrentUser, setShowAuthModal, t])
}
