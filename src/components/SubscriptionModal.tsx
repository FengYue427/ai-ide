import React, { useEffect, useMemo, useState } from 'react'
import { Building2, Check, Crown, Loader2, Zap } from 'lucide-react'
import { BETA_BILLING_NOTE, hasCheckoutPayment } from '../../lib/billing/checkout'
import { readJsonResponse } from '../services/apiUtils'
import { authService } from '../services/authService'
import { subscriptionService } from '../services/subscriptionService'
import { useI18n } from '../i18n'
import type { TranslationKey } from '../i18n'
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

function buildFallbackPlans(t: (key: TranslationKey) => string): Plan[] {
  return [
    {
      id: 'free',
      name: 'free',
      displayName: t('subscription.plan.free.name'),
      description: t('subscription.plan.free.desc'),
      price: 0,
      currency: 'CNY',
      features: [
        t('subscription.plan.free.f1'),
        t('subscription.plan.free.f2'),
        t('subscription.plan.free.f3'),
      ],
      limits: { aiRequestsPerDay: 200, workspaces: 10, storageGB: 3 },
    },
    {
      id: 'pro',
      name: 'pro',
      displayName: t('subscription.plan.pro.name'),
      description: t('subscription.plan.pro.desc'),
      price: 19,
      currency: 'CNY',
      features: [
        t('subscription.plan.pro.f1'),
        t('subscription.plan.pro.f2'),
        t('subscription.plan.pro.f3'),
      ],
      limits: { aiRequestsPerDay: 5000, workspaces: -1, storageGB: 30 },
    },
    {
      id: 'enterprise',
      name: 'enterprise',
      displayName: t('subscription.plan.enterprise.name'),
      description: t('subscription.plan.enterprise.desc'),
      price: 49,
      currency: 'CNY',
      features: [
        t('subscription.plan.enterprise.f1'),
        t('subscription.plan.enterprise.f2'),
        t('subscription.plan.enterprise.f3'),
      ],
      limits: { aiRequestsPerDay: -1, workspaces: -1, storageGB: 100 },
    },
  ]
}

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
  const { t, locale } = useI18n()
  const setCurrentPlan = useIDEStore((s) => s.setCurrentPlan)
  const fallbackPlans = useMemo(() => buildFallbackPlans(t), [t])
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
          setError(t('subscription.plans.loadError'))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlans(fallbackPlans)
          setError(t('subscription.plans.loadError'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [fallbackPlans, setCurrentPlan, t])

  const currentPlanInfo = useMemo(() => plans.find((plan) => plan.name === currentPlan), [plans, currentPlan])
  const checkoutAvailable = hasCheckoutPayment(paymentMethods)

  const handleSubscribe = async (planId: string, planName: string) => {
    if (planName === 'free') {
      onClose()
      return
    }

    const session = await authService.getSession()
    if (!session?.user) {
      setError(t('subscription.loginRequired'))
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
          setSuccess(data.message || t('subscription.upgraded', { plan: data.plan }))
          window.setTimeout(() => onClose(), 1200)
        } else {
          setError(data?.error || t('subscription.devUpgradeFailed'))
        }
      } catch {
        setError(t('subscription.payFailed'))
      } finally {
        setProcessingPlanId(null)
      }
      return
    }

    if (!checkoutAvailable) {
      setSuccess(BETA_BILLING_NOTE)
      return
    }

    setError(t('subscription.payNotConfigured'))
  }

  const formatLimit = (value: number, unit: string) =>
    value === -1 ? t('subscription.unlimited') : `${value}${unit}`

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
        setError(data?.error || t('subscription.cancelFailed'))
        return
      }
      if (data?.subscription) {
        setSubscription(data.subscription)
        setCurrentPlan(data.subscription.plan)
        subscriptionService.subscribeToPlan(data.subscription.plan)
      }
      setSuccess(data?.message || t('subscription.updated'))
    } catch {
      setError(t('subscription.cancelFailedRetry'))
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
        setError(data?.error || t('subscription.resumeFailed'))
        return
      }
      if (data?.subscription) {
        setSubscription(data.subscription)
        setCurrentPlan(data.subscription.plan)
        subscriptionService.subscribeToPlan(data.subscription.plan)
      }
      setSuccess(data?.message || t('subscription.resumed'))
    } catch {
      setError(t('subscription.resumeFailedRetry'))
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
      setError(data?.error || t('subscription.portalFailed'))
    } catch {
      setError(t('subscription.portalPageFailed'))
    } finally {
      setProcessingPlanId(null)
    }
  }

  const isPaidPlan = currentPlan !== 'free'
  const periodEndLabel =
    subscription?.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd).toLocaleDateString(locale, {
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
            setSuccess(t('subscription.paySuccess'))
          }}
        />
      )}
    <ModalShell
      title={t('subscription.title')}
      onClose={onClose}
      className="modal--wide"
      bodyClassName="modal-body--grid"
      ariaLabel={t('subscription.title')}
    >
          <div className="subscription-hero">
            <div className="subscription-hero-title">{t('subscription.hero.title')}</div>
            <p className="subscription-hero-desc">
              {t('subscription.hero.desc', {
                planSuffix: currentPlanInfo
                  ? t('subscription.hero.planIs', { name: currentPlanInfo.displayName })
                  : t('subscription.hero.planActive'),
              })}
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
              <div className="subscription-manage-title">{t('subscription.manage.title')}</div>
              {subscription.cancelAtPeriodEnd ? (
                <div style={{ fontSize: '13px', color: '#ffb648', lineHeight: 1.6 }}>
                  {t('subscription.manage.cancelScheduled')}
                  {periodEndLabel
                    ? t('subscription.manage.cancelUntil', {
                        date: periodEndLabel,
                        plan: currentPlanInfo?.displayName || currentPlan,
                      })
                    : ''}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {t('subscription.manage.status', { status: subscription.status })}
                  {periodEndLabel
                    ? t('subscription.manage.periodEnd', { date: periodEndLabel })
                    : ''}
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
                    {resuming ? t('subscription.resuming') : t('subscription.resume')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={cancelling}
                    onClick={() => void handleCancel(false)}
                  >
                    {cancelling ? t('subscription.processing') : t('subscription.cancelEnd')}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={cancelling || resuming}
                  onClick={() => void handleCancel(true)}
                >
                  {t('subscription.downgradeNow')}
                </button>
                {paymentMethods.stripe && (
                  <button type="button" className="btn btn-secondary" onClick={() => void handleBillingPortal()}>
                    {t('subscription.stripePortal')}
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="subscription-loading">
              <Loader2 size={28} className="spin" />
              <span>{t('subscription.loading')}</span>
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
                            {t('subscription.currentPlan')}
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
                        <span className="subscription-plan-period">{t('subscription.perMonth')}</span>
                      </div>

                      <div style={{ display: 'grid', gap: '8px' }}>
                        {[
                          [
                            t('subscription.limit.ai'),
                            formatLimit(plan.limits.aiRequestsPerDay, t('subscription.perDay')),
                          ],
                          [
                            t('subscription.limit.workspaces'),
                            formatLimit(plan.limits.workspaces, t('subscription.unit.workspaces')),
                          ],
                          [
                            t('subscription.limit.storage'),
                            formatLimit(plan.limits.storageGB, ' GB'),
                          ],
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
                              {t('subscription.checkout.redirect')}
                            </>
                          ) : isCurrent ? (
                            t('subscription.checkout.current')
                          ) : plan.price === 0 ? (
                            t('subscription.checkout.free')
                          ) : checkoutAvailable ? (
                            paymentMethods.alipay || paymentMethods.wechat
                              ? t('subscription.checkout.cn')
                              : t('subscription.checkout.upgrade')
                          ) : (
                            t('subscription.checkout.beta')
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
