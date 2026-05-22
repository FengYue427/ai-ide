import { useEffect } from 'react'
import type { ToastKind } from '../components/FeedbackCenter'
import type { TranslateFn } from '../i18n'
import { setApiErrorHandler } from '../services/apiUtils'

type NotifyFn = (kind: ToastKind, title: string, detail?: string) => void

/** Toast when cloud API returns 5xx (e.g. DB unavailable on Vercel). */
export function useApiErrorFeedback(notify: NotifyFn, t: TranslateFn) {
  useEffect(() => {
    setApiErrorHandler(({ status }) => {
      if (status === 503) {
        notify('error', t('notify.apiUnavailable'), t('notify.apiUnavailableDetail'))
        return
      }
      notify('error', t('notify.apiError'), t('notify.apiErrorDetail', { status: String(status) }))
    })
    return () => setApiErrorHandler(null)
  }, [notify, t])
}
