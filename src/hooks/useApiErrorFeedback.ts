import { useEffect } from 'react'
import type { ToastKind } from '../components/FeedbackCenter'
import type { TranslateFn } from '../i18n'
import { setApiErrorHandler } from '../services/apiUtils'

export interface NotifyOptions {
  onClick?: () => void
  actionLabel?: string
  onAction?: () => void
}

export type NotifyFn = (
  kind: ToastKind,
  title: string,
  detail?: string,
  options?: NotifyOptions,
) => void

/** Toast when cloud API returns 5xx (e.g. DB unavailable on Vercel). */
export function useApiErrorFeedback(
  notify: NotifyFn,
  t: TranslateFn,
  onOpenSettings?: () => void,
) {
  useEffect(() => {
    setApiErrorHandler(({ status }) => {
      const actionOptions =
        onOpenSettings && status === 503
          ? { actionLabel: t('feedback.toastAction'), onAction: onOpenSettings }
          : undefined

      if (status === 503) {
        notify('error', t('notify.apiUnavailable'), t('notify.apiUnavailableDetail'), actionOptions)
        return
      }
      notify('error', t('notify.apiError'), t('notify.apiErrorDetail', { status: String(status) }))
    })
    return () => setApiErrorHandler(null)
  }, [notify, onOpenSettings, t])
}
