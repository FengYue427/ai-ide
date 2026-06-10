import React, { useEffect, useRef, useState } from 'react'
import { ExternalLink, Loader2, Smartphone } from 'lucide-react'
import { useI18n } from '../i18n'
import { ALIPAY_PENDING_KEY, syncBillingFromServer } from '../services/billingSync'
import { findPlanByName, getPlanPriceCny } from '../../lib/billing/plans'
import { readJsonResponse, apiFetch } from '../services/apiUtils'
import { navigateToExternalUrl, appendDesktopCheckoutFields } from '../lib/externalNavigation'
import { AlertBanner } from './ui/AlertBanner'
import { ModalShell } from './ui/ModalShell'

export interface CnPayPlan {
  name: string
  displayName: string
  price: number
  currency: string
  description?: string
}

interface CnPayModalProps {
  plan: CnPayPlan
  onClose: () => void
  onSuccess?: () => void
  alipay?: boolean
  wechat?: boolean
}

function formatPrice(plan: CnPayPlan, freeLabel: string): string {
  if (plan.price === 0) return freeLabel
  const catalog = findPlanByName(plan.name)
  if (catalog) {
    const cny = getPlanPriceCny(catalog)
    if (cny > 0) return `¥${cny}`
  }
  if (plan.currency === 'CNY') return `¥${plan.price}`
  const n = plan.price
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
}

type PayChannel = 'alipay' | 'wechat'

const CnPayModal: React.FC<CnPayModalProps> = ({
  plan,
  onClose,
  onSuccess,
  alipay = true,
  wechat = true,
}) => {
  const { t } = useI18n()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState<PayChannel | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [wechatQr, setWechatQr] = useState<{ orderId: string; codeUrl: string } | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const redirectingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handlePaid = async (planName: string) => {
    await syncBillingFromServer(planName)
    onSuccess?.()
    onClose()
  }

  const startWechatPoll = (orderId: string, planName: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/payment/orders/${orderId}`, { credentials: 'include' })
        const data = await readJsonResponse<{ order?: { status?: string } }>(res)
        if (data?.order?.status === 'paid') {
          if (pollRef.current) clearInterval(pollRef.current)
          void handlePaid(planName)
        }
      } catch {
        // keep polling
      }
    }, 2000)
  }

  const markAlipayRedirect = () => {
    redirectingRef.current = true
    setRedirecting(true)
    sessionStorage.setItem(
      ALIPAY_PENDING_KEY,
      JSON.stringify({ plan: plan.name, ts: Date.now() }),
    )
  }

  const checkout = async (channel: PayChannel) => {
    setLoading(channel)
    setError('')
    setWechatQr(null)
    redirectingRef.current = false
    if (pollRef.current) clearInterval(pollRef.current)

    try {
      const res = await apiFetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(appendDesktopCheckoutFields({ planId: plan.name, channel })),
      })

      const data = await readJsonResponse<{
        mode?: string
        url?: string
        formHtml?: string
        codeUrl?: string
        orderId?: string
        error?: string
      }>(res)

      if (!res.ok) {
        setError(data?.error || t('pay.createFailed'))
        return
      }

      if (data?.mode === 'alipay' && data.formHtml) {
        markAlipayRedirect()
        const wrap = document.createElement('div')
        wrap.style.display = 'none'
        wrap.innerHTML = data.formHtml
        document.body.appendChild(wrap)
        const form = wrap.querySelector('form')
        if (form) {
          form.setAttribute('target', '_self')
          window.setTimeout(() => form.submit(), 400)
          return
        }
        document.body.removeChild(wrap)
        sessionStorage.removeItem(ALIPAY_PENDING_KEY)
        redirectingRef.current = false
        setRedirecting(false)
        setError(t('pay.channelInvalid'))
        return
      }

      if (data?.mode === 'alipay' && data.url) {
        markAlipayRedirect()
        void navigateToExternalUrl(data.url)
        return
      }

      if (data?.mode === 'wechat' && data.codeUrl && data.orderId) {
        setWechatQr({ orderId: data.orderId, codeUrl: data.codeUrl })
        startWechatPoll(data.orderId, plan.name)
        return
      }

      setError(data?.error || t('pay.channelInvalid'))
    } catch {
      setError(t('pay.networkError'))
    } finally {
      if (!redirectingRef.current) setLoading(null)
    }
  }

  const qrImageUrl = wechatQr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(wechatQr.codeUrl)}`
    : null

  const showAlipay = alipay
  const showWechat = wechat
  const channelCount = Number(showAlipay) + Number(showWechat)
  const handleClose = redirecting ? () => {} : onClose
  const secureNote =
    showAlipay && showWechat
      ? t('pay.secureNote')
      : showAlipay
        ? t('pay.secureNoteAlipay')
        : t('pay.secureNoteWechat')

  return (
    <ModalShell
      title={t('pay.title', { plan: plan.displayName })}
      onClose={handleClose}
      elevated
      className="modal--compact"
      bodyClassName="pay-modal-body"
      ariaLabel={t('pay.aria')}
    >
      <div className="pay-summary">
        <div className="pay-summary-label">{t('pay.summaryLabel')}</div>
        <div className="pay-summary-plan">{plan.displayName}</div>
        {plan.description && <p className="pay-summary-desc">{plan.description}</p>}
      </div>

      <div className="pay-amount-block">
        <span className="pay-amount">{formatPrice(plan, t('pay.free'))}</span>
        <span className="pay-amount-unit">{t('pay.perMonth')}</span>
      </div>

      {error && <AlertBanner variant="warning">{error}</AlertBanner>}

      {redirecting ? (
        <div className="pay-redirect" role="status" aria-live="polite">
          <Loader2 size={32} className="spin" />
          <div className="pay-redirect-title">{t('pay.alipayRedirectTitle')}</div>
          <p className="pay-redirect-desc">{t('pay.alipayRedirectDesc')}</p>
        </div>
      ) : wechatQr ? (
        <div className="pay-qr-wrap">
          <p>{t('pay.wechatScan')}</p>
          {qrImageUrl && <img src={qrImageUrl} alt={t('pay.wechatQrAlt')} width={220} height={220} />}
          <p className="pay-qr-hint">{t('pay.wechatHint')}</p>
        </div>
      ) : (
        <>
          <div className={`pay-channel-list${channelCount === 1 ? ' pay-channel-list--single' : ''}`}>
            {showAlipay && (
              <button
                type="button"
                className="btn-pay btn-pay--alipay"
                disabled={!!loading}
                aria-busy={loading === 'alipay'}
                onClick={() => void checkout('alipay')}
              >
                {loading === 'alipay' ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <ExternalLink size={18} />
                )}
                {t('pay.alipay')}
              </button>
            )}
            {showWechat && (
              <button
                type="button"
                className="btn-pay btn-pay--wechat"
                disabled={!!loading}
                aria-busy={loading === 'wechat'}
                onClick={() => void checkout('wechat')}
              >
                {loading === 'wechat' ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <Smartphone size={18} />
                )}
                {t('pay.wechat')}
              </button>
            )}
            {!showAlipay && !showWechat && (
              <AlertBanner variant="warning">{t('pay.channelInvalid')}</AlertBanner>
            )}
          </div>
          <p className="pay-footer-note">{secureNote}</p>
        </>
      )}
    </ModalShell>
  )
}

export default CnPayModal
