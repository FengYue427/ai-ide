import { useEffect } from 'react'
import { authService } from '../services/authService'
import { syncBillingFromServer } from '../services/billingSync'
import { isDesktopApp } from '../services/desktopBridge'
import type { DesktopDeepLinkPayload } from '../lib/desktopDeepLink'
import { markDesktopShellReturn } from '../lib/externalNavigation'
import { useIDEStore } from '../store/ideStore'
import type { ToastKind } from '../components/FeedbackCenter'
import type { TranslateFn } from '../i18n'

async function handleDesktopDeepLink(payload: DesktopDeepLinkPayload): Promise<void> {
  const { setCurrentUser } = useIDEStore.getState()

  if (payload.kind === 'oauth') {
    const token = payload.params.token?.trim()
    if (token) {
      const user = await authService.applyBearerTokenFromDeepLink(token)
      if (user) setCurrentUser(user)
    } else {
      const synced = await authService.syncOAuthSession()
      if (synced.user) setCurrentUser(synced.user)
    }
    markDesktopShellReturn('oauth')
    await syncBillingFromServer()
    return
  }

  const plan = payload.params.plan
  const status = payload.params.subscription
  if (status === 'success') {
    await syncBillingFromServer(plan)
  } else {
    await syncBillingFromServer()
  }
  markDesktopShellReturn('billing')
}

/** Electron renderer: OAuth/billing completed in external browser → deep link back. */
export function useDesktopDeepLink(
  notify: (kind: ToastKind, title: string, detail?: string) => void,
  t: TranslateFn,
) {
  useEffect(() => {
    if (!isDesktopApp()) return
    const api = window.aiIdeDesktop
    if (!api?.onDeepLink) return

    return api.onDeepLink((payload) => {
      void (async () => {
        try {
          await handleDesktopDeepLink(payload)
        } catch {
          notify('error', t('desktop.returnPrompt.failedTitle'), t('desktop.returnPrompt.failedDetail'))
        }
      })()
    })
  }, [notify, t])
}
