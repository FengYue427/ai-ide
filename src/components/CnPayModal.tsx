import React, { useEffect, useRef, useState } from 'react'
import { Loader2, Smartphone } from 'lucide-react'
import { readJsonResponse } from '../services/apiUtils'
import { subscriptionService } from '../services/subscriptionService'
import { useIDEStore } from '../store/ideStore'
import { AlertBanner } from './ui/AlertBanner'
import { ModalShell } from './ui/ModalShell'

export interface CnPayPlan {
  name: string
  displayName: string
  price: number
  currency: string
}

interface CnPayModalProps {
  plan: CnPayPlan
  onClose: () => void
  onSuccess?: () => void
}

function formatPrice(plan: CnPayPlan): string {
  if (plan.price === 0) return '免费'
  if (plan.currency === 'CNY') return `¥${plan.price}`
  return `$${plan.price}`
}

type PayChannel = 'alipay' | 'wechat'

const CnPayModal: React.FC<CnPayModalProps> = ({ plan, onClose, onSuccess }) => {
  const setCurrentPlan = useIDEStore((s) => s.setCurrentPlan)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState<PayChannel | null>(null)
  const [wechatQr, setWechatQr] = useState<{ orderId: string; codeUrl: string } | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handlePaid = (planName: string) => {
    subscriptionService.subscribeToPlan(planName)
    setCurrentPlan(planName)
    onSuccess?.()
    onClose()
  }

  const startWechatPoll = (orderId: string, planName: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/orders/${orderId}`, { credentials: 'include' })
        const data = await readJsonResponse<{ order?: { status?: string } }>(res)
        if (data?.order?.status === 'paid') {
          if (pollRef.current) clearInterval(pollRef.current)
          handlePaid(planName)
        }
      } catch {
        // keep polling
      }
    }, 2000)
  }

  const checkout = async (channel: PayChannel) => {
    setLoading(channel)
    setError('')
    setWechatQr(null)
    if (pollRef.current) clearInterval(pollRef.current)

    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId: plan.name, channel }),
      })

      const data = await readJsonResponse<{
        mode?: string
        url?: string
        codeUrl?: string
        orderId?: string
        error?: string
      }>(res)

      if (!res.ok) {
        setError(data?.error || '创建支付失败')
        return
      }

      if (data?.mode === 'alipay' && data.url) {
        window.location.href = data.url
        return
      }

      if (data?.mode === 'wechat' && data.codeUrl && data.orderId) {
        setWechatQr({ orderId: data.orderId, codeUrl: data.codeUrl })
        startWechatPoll(data.orderId, plan.name)
        return
      }

      setError(data?.error || '支付渠道未返回有效数据')
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(null)
    }
  }

  const qrImageUrl = wechatQr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(wechatQr.codeUrl)}`
    : null

  return (
    <ModalShell
      title={`支付 — ${plan.displayName}`}
      onClose={onClose}
      className="modal--compact"
      bodyClassName="modal-body--grid"
      ariaLabel="国内支付"
    >
      <div className="pay-amount">
        {formatPrice(plan)}
        <span className="pay-amount-unit"> / 月</span>
      </div>

      {error && <AlertBanner variant="warning">{error}</AlertBanner>}

      {wechatQr ? (
        <div className="pay-qr-wrap">
          <p>请使用微信扫一扫完成支付</p>
          {qrImageUrl && <img src={qrImageUrl} alt="微信支付二维码" width={220} height={220} />}
          <p className="pay-qr-hint">支付成功后将自动升级，请勿关闭此窗口</p>
        </div>
      ) : (
        <div className="modal-body--grid">
          <button
            type="button"
            className="btn-pay btn-pay--alipay"
            disabled={!!loading}
            onClick={() => void checkout('alipay')}
          >
            {loading === 'alipay' ? <Loader2 size={16} className="spin" /> : null}
            支付宝支付
          </button>
          <button
            type="button"
            className="btn-pay btn-pay--wechat"
            disabled={!!loading}
            onClick={() => void checkout('wechat')}
          >
            {loading === 'wechat' ? <Loader2 size={16} className="spin" /> : <Smartphone size={16} />}
            微信支付
          </button>
        </div>
      )}
    </ModalShell>
  )
}

export default CnPayModal
