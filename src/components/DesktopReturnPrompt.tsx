import { useEffect, useMemo, useState } from 'react'
import { Monitor } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  buildBillingDesktopDeepLink,
  buildOAuthDesktopDeepLink,
  consumeDesktopReturnPending,
  type DesktopDeepLinkKind,
} from '../lib/desktopDeepLink'
import { isDesktopApp } from '../services/desktopBridge'

/** Shown on API origin after OAuth/payment when desktop_shell=1 — fallback if auto deep link fails. */
export function DesktopReturnPrompt() {
  const { t } = useI18n()
  const [pendingKind, setPendingKind] = useState<DesktopDeepLinkKind | null>(null)
  const [searchParams] = useState(() => new URLSearchParams(window.location.search))

  useEffect(() => {
    if (isDesktopApp()) return
    const kind = consumeDesktopReturnPending()
    if (kind) setPendingKind(kind)
  }, [])

  const deepLinkUrl = useMemo(() => {
    if (!pendingKind) return null
    if (pendingKind === 'billing') return buildBillingDesktopDeepLink(searchParams)
    return buildOAuthDesktopDeepLink()
  }, [pendingKind, searchParams])

  if (!pendingKind || !deepLinkUrl) return null

  return (
    <div className="desktop-return-prompt" role="status">
      <Monitor size={16} aria-hidden />
      <div className="desktop-return-prompt__body">
        <strong>{t('desktop.returnPrompt.title')}</strong>
        <span>{t('desktop.returnPrompt.detail')}</span>
      </div>
      <a className="desktop-return-prompt__btn" href={deepLinkUrl}>
        {t('desktop.returnPrompt.button')}
      </a>
    </div>
  )
}
