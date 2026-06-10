import { useEffect } from 'react'
import { DESKTOP_SHELL_RETURN_FLAG, type DesktopShellReturnKind } from '../lib/externalNavigation'
import type { TranslateFn } from '../i18n'
import type { ToastKind } from '../components/FeedbackCenter'

/** Toast after OAuth or billing completes on API origin and Electron reloads the local shell. */
export function useDesktopShellReturn(
  notify: (kind: ToastKind, title: string, detail?: string) => void,
  t: TranslateFn,
) {
  useEffect(() => {
    const kind = sessionStorage.getItem(DESKTOP_SHELL_RETURN_FLAG) as DesktopShellReturnKind | null
    if (!kind) return
    sessionStorage.removeItem(DESKTOP_SHELL_RETURN_FLAG)
    if (kind === 'billing') {
      notify('success', t('billing.desktopReturnTitle'), t('billing.desktopReturnDetail'))
      return
    }
    notify('success', t('auth.oauth.desktopReturnTitle'), t('auth.oauth.desktopReturnDetail'))
  }, [notify, t])
}
