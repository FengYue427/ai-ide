import React, { useEffect, useMemo, useState } from 'react'
import { Building2, Check, Crown, Loader2, Zap } from 'lucide-react'
import { BETA_BILLING_NOTE, hasCheckoutPayment } from '../../lib/billing/checkout'
import { readJsonResponse } from '../services/apiUtils'
import { authService } from '../services/authService'
import { subscriptionService } from '../services/subscriptionService'
import { useIDEStore } from '../store/ideStore'
import CnPayModal from './CnPayModal'
import { AlertBanner } from './ui/AlertBanner'
import { ModalShell } from './ui/ModalShell'

interface Plan {
  id: string
  name: string
  displayName: string
  description: string
  price: number
  currency: string
  features: string[]
  limits: {
    aiRequestsPerDay: number
    workspaces: number
    storageGB: number
  }
}

interface SubscriptionStatus {
  plan: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

interface SubscriptionModalProps {
  onClose: () => void
  currentPlan?: string
}

const fallbackPlans: Plan[] = [
  {
    id: 'free',
    name: 'free',
    displayName: '免费版',
    description: '个人学习与日常小项目，配额已放宽。',
    price: 0,
    currency: 'CNY',
    features: ['基础 AI 对话', '10 个云工作区', '每日 200 次配额'],
    limits: { aiRequestsPerDay: 200, workspaces: 10, storageGB: 3 },
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: '专业版',
    description: '高频个人开发者，¥19/月。',
    price: 19,
    currency: 'CNY',
    features: ['每日 5000 次配额', '无限工作区', '支付宝 / 微信付款'],
    limits: { aiRequestsPerDay: 5000, workspaces: -1, storageGB: 30 },
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: '团队版',
    description: '小团队与重度用户，¥49/月。',
    price: 49,
    currency: 'CNY',
    features: ['配额不限', '无限工作区', '团队能力（规划）'],
    limits: { aiRequestsPerDay: -1, workspaces: -1, storageGB: 100 },
  },
]

const planVisuals: Record<string, { gradient: string; border: string; icon: React.ReactNode }> = {
  free: {
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    border: '#64748b',
    icon: <Zap size={22} />,
  },
  pro: {
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: '#6366f1',
    icon: <Crown size={22} />,
  },
  enterprise: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    border: '#f59e0b',
    icon: <Building2 size={22} />,
  },
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, currentPlan = 'free' }) => {
  const setCurrentPlan = useIDEStore((s) => s.setCurrentPlan)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [cnPayPlan, setCnPayPlan] = useState<Plan | null>(null)
  const [paymentMethods, setPaymentMethods] = useState({
    alipay: false,
    wechat: false,
    stripe: false,
    devMock: false,
  })
  const [pricingNote, setPricingNote] = useState('')

  const loadSubscription = () => {
    return fetch('/api/subscription', { credentials: 'include' })
      .then((response) => readJsonResponse<{ subscription?: SubscriptionStatus }>(response))
      .then((data) => {
        if (data?.subscription) {
          setSubscription(data.subscription)
          setCurrentPlan(data.subscription.plan)
          subscriptionService.subscribeToPlan(data.subscription.plan)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    let cancelled = false

    void loadSubscription()

    fetch('/api/subscription/payment-methods', { credentials: 'include' })
      .then((r) =>
        readJsonResponse<{
          alipay?: boolean
          wechat?: boolean
          stripe?: boolean
          devMock?: boolean
          pricingNote?: string
        }>(r),
      )
      .then((data) => {
        if (data) {
          setPaymentMethods({
            alipay: Boolean(data.alipay),
            wechat: Boolean(data.wechat),
            stripe: Boolean(data.stripe),
            devMock: Boolean(data.devMock),
          })
          if (data.pricingNote) setPricingNote(data.pricingNote)
        }
      })
      .catch(() => {})

    fetch('/api/subscription/plans', { credentials: 'include' })
      .then((response) => readJsonResponse<{ plans?: Plan[] }>(response))
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data?.plans) && data.plans.length > 0) {
          setPlans(data.plans)
        } else {
          setPlans(fallbackPlans)
          setError('暂时无法读取在线套餐信息，先为你展示默认方案。')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlans(fallbackPlans)
          setError('暂时无法读取在线套餐信息，先为你展示默认方案。')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const currentPlanInfo = useMemo(() => plans.find((plan) => plan.name === currentPlan), [plans, currentPlan])
  const checkoutAvailable = hasCheckoutPayment(paymentMethods)

  const handleSubscribe = async (planId: string, planName: string) => {
    if (planName === 'free') {
      onClose()
      return
    }

    const session = await authService.getSession()
    if (!session?.user) {
      setError('请先登录后再升级订阅')
      return
    }

    const plan = plans.find((p) => p.name === planName)
    if (!plan) return

    setError('')
    setSuccess('')

    if (paymentMethods.alipay || paymentMethods.wechat) {
      setCnPayPlan(plan)
      return
    }

    if (paymentMethods.devMock) {
      setProcessingPlanId(planId)
      try {
        const response = await fetch('/api/subscription/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ planId: planName }),
        })
        const data = await readJsonResponse<{ mode?: string; plan?: string; message?: string; error?: string }>(
          response,
        )
        if (response.ok && data?.mode === 'dev_mock' && data.plan) {
          subscriptionService.subscribeToPlan(data.plan)
          setCurrentPlan(data.plan)
          setSuccess(data.message || `已升级为 ${data.plan}`)
          window.setTimeout(() => onClose(), 1200)
        } else {
          setError(data?.error || '开发模式升级失败')
        }
      } catch {
        setError('支付请求失败，请检查网络或稍后重试。')
      } finally {
        setProcessingPlanId(null)
      }
      return
    }

    if (!checkoutAvailable) {
      setSuccess(BETA_BILLING_NOTE)
      return
    }

    setError('支付尚未配置，请在服务端设置支付宝或微信商户参数。')
  }

  const formatLimit = (value: number, unit: string) => (value === -1 ? '无限制' : `${value}${unit}`)

  const handleCancel = async (immediate: boolean) => {
    setCancelling(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ immediate }),
      })
      const data = await readJsonResponse<{
        subscription?: SubscriptionStatus
        message?: string
        error?: string
      }>(response)
      if (!response.ok) {
        setError(data?.error || '取消订阅失败')
        return
      }
      if (data?.subscription) {
        setSubscription(data.subscription)
        setCurrentPlan(data.subscription.plan)
        subscriptionService.subscribeToPlan(data.subscription.plan)
      }
      setSuccess(data?.message || '订阅状态已更新')
    } catch {
      setError('取消订阅失败，请稍后重试')
    } finally {
      setCancelling(false)
    }
  }

  const handleResume = async () => {
    setResuming(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/api/subscription/resume', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await readJsonResponse<{
        subscription?: SubscriptionStatus
        message?: string
        error?: string
      }>(response)
      if (!response.ok) {
        setError(data?.error || '恢复订阅失败')
        return
      }
      if (data?.subscription) {
        setSubscription(data.subscription)
        setCurrentPlan(data.subscription.plan)
        subscriptionService.subscribeToPlan(data.subscription.plan)
      }
      setSuccess(data?.message || '订阅已恢复')
    } catch {
      setError('恢复订阅失败，请稍后重试')
    } finally {
      setResuming(false)
    }
  }

  const handleBillingPortal = async () => {
    setProcessingPlanId('portal')
    setError('')
    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await readJsonResponse<{ url?: string; error?: string }>(response)
      if (data?.url && /^https?:\/\//i.test(data.url)) {
        window.location.href = data.url
        return
      }
      setError(data?.error || '无法打开 Stripe 客户门户')
    } catch {
      setError('无法打开账单管理页面')
    } finally {
      setProcessingPlanId(null)
    }
  }

  const isPaidPlan = currentPlan !== 'free'
  const periodEndLabel =
    subscription?.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  return (
    <>
      {cnPayPlan && (
        <CnPayModal
          plan={cnPayPlan}
          onClose={() => setCnPayPlan(null)}
          onSuccess={() => {
            void loadSubscription()
            setSuccess('支付成功，订阅已更新')
          }}
        />
      )}
    <ModalShell
      title="订阅计划"
      onClose={onClose}
      className="modal--wide"
      bodyClassName="modal-body--grid"
      ariaLabel="订阅计划"
    >
          <div className="subscription-hero">
            <div className="subscription-hero-title">选择更适合你的工作节奏</div>
            <p className="subscription-hero-desc">
              当前计划{currentPlanInfo ? `是 ${currentPlanInfo.displayName}` : '已启用'}。升级后可以获得更高的 AI 配额、更大的工作区容量，以及更完整的协作与管理能力。
            </p>
          </div>

          {pricingNote && (
            <AlertBanner variant="info">{pricingNote}</AlertBanner>
          )}

          {!checkoutAvailable && !loading && (
            <div className="subscription-beta-banner" role="status">
              {BETA_BILLING_NOTE}
            </div>
          )}

          {error && <AlertBanner variant="warning">{error}</AlertBanner>}

          {success && <AlertBanner variant="success">{success}</AlertBanner>}

          {isPaidPlan && subscription && (
            <div className="subscription-manage">
              <div className="subscription-manage-title">当前订阅</div>
              {subscription.cancelAtPeriodEnd ? (
                <div style={{ fontSize: '13px', color: '#ffb648', lineHeight: 1.6 }}>
                  已安排在周期结束后降级为免费版
                  {periodEndLabel ? `（${periodEndLabel} 前仍可使用 ${currentPlanInfo?.displayName || currentPlan}）` : ''}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  状态：{subscription.status}
                  {periodEndLabel ? ` · 当前周期至 ${periodEndLabel}` : ''}
                </div>
              )}
              <div className="subscription-manage-actions">
                {subscription.cancelAtPeriodEnd ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={resuming}
                    onClick={() => void handleResume()}
                  >
                    {resuming ? '恢复中…' : '恢复订阅续费'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={cancelling}
                    onClick={() => void handleCancel(false)}
                  >
                    {cancelling ? '处理中…' : '周期结束后取消'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={cancelling || resuming}
                  onClick={() => void handleCancel(true)}
                >
                  立即降级免费版
                </button>
                {paymentMethods.stripe && (
                  <button type="button" className="btn btn-secondary" onClick={() => void handleBillingPortal()}>
                    Stripe 账单管理
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="subscription-loading">
              <Loader2 size={28} className="spin" />
              <span>正在加载套餐信息...</span>
            </div>
          ) : (
            <div className="subscription-plans-grid">
              {plans.map((plan) => {
                const visual = planVisuals[plan.name] || planVisuals.free
                const isCurrent = plan.name === currentPlan
                const isProcessing = processingPlanId === plan.id

                return (
                  <div
                    key={plan.id}
                    className={`subscription-plan-card${isCurrent ? ' subscription-plan-card--current' : ''}`}
                  >
                    <div className="subscription-plan-head" style={{ background: visual.gradient }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.18)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {visual.icon}
                        </div>
                        {isCurrent && (
                          <span
                            style={{
                              padding: '5px 10px',
                              borderRadius: '999px',
                              background: 'rgba(255,255,255,0.18)',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            当前计划
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>{plan.displayName}</div>
                      <div style={{ fontSize: '13px', lineHeight: 1.6, opacity: 0.9 }}>{plan.description}</div>
                    </div>

                    <div className="subscription-plan-body">
                      <div className="subscription-plan-price-row">
                        <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                          {plan.currency === 'CNY' ? '¥' : '$'}
                        </span>
                        <span className="subscription-plan-price">{plan.price}</span>
                        <span className="subscription-plan-period">/月</span>
                      </div>

                      <div style={{ display: 'grid', gap: '8px' }}>
                        {[
                          ['AI 请求', formatLimit(plan.limits.aiRequestsPerDay, ' / 天')],
                          ['工作区', formatLimit(plan.limits.workspaces, ' 个')],
                          ['存储空间', formatLimit(plan.limits.storageGB, ' GB')],
                        ].map(([label, value]) => (
                          <div key={label} className="subscription-limit-row">
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gap: '10px' }}>
                        {plan.features.map((feature) => (
                          <div key={feature} className="subscription-feature-row">
                            <Check size={15} color={visual.border} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="subscription-plan-footer">
                        <button
                          className={isCurrent ? 'btn btn-secondary' : 'btn btn-primary'}
                          onClick={() => handleSubscribe(plan.id, plan.name)}
                          disabled={!!processingPlanId || isCurrent}
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 size={16} className="spin" style={{ marginRight: '6px' }} />
                              跳转支付...
                            </>
                          ) : isCurrent ? (
                            '当前使用中'
                          ) : plan.price === 0 ? (
                            '继续免费使用'
                          ) : checkoutAvailable ? (
                            paymentMethods.alipay || paymentMethods.wechat ? '支付宝 / 微信升级' : '立即升级'
                          ) : (
                            '公测免费'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
    </ModalShell>
    </>
  )
}

export default SubscriptionModal
