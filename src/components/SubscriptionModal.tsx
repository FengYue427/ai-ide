import React, { useEffect, useMemo, useState } from 'react'
import { Building2, Check, Crown, Loader2, Zap } from 'lucide-react'
import { hasCheckoutPayment } from '../../lib/billing/checkout'
import { localizePlans } from '../lib/localizePlan'
import { pickApiResponseMessage } from '../lib/apiUserMessage'
import { buildSubscriptionPricingNote } from '../lib/subscriptionPricingNote'
import { readJsonResponse } from '../services/apiUtils'
import { BILLING_SUCCESS_KEY } from '../services/billingSync'
import { authService } from '../services/authService'
import { subscriptionService } from '../services/subscriptionService'
import { useI18n, type TranslationKey } from '../i18n'
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
      limits: { aiRequestsPerDay: 200, workspaces: -1, storageGB: 30 },
    },
    {
      id: 'pro',
      name: 'pro',
      displayName: t('subscription.plan.pro.name'),
      description: t('subscription.plan.pro.desc'),
      price: 9.99,
      currency: 'USD',
      features: [
        t('subscription.plan.pro.f1'),
        t('subscription.plan.pro.f2'),
        t('subscription.plan.pro.f3'),
      ],
      limits: { aiRequestsPerDay: 2000, workspaces: -1, storageGB: 30 },
    },
    {
      id: 'enterprise',
      name: 'enterprise',
      displayName: t('subscription.plan.enterprise.name'),
      description: t('subscription.plan.enterprise.desc'),
      price: 19.99,
      currency: 'USD',
      features: [
        t('subscription.plan.enterprise.f1'),
        t('subscription.plan.enterprise.f2'),
        t('subscription.plan.enterprise.f3'),
      ],
      limits: { aiRequestsPerDay: -1, workspaces: -1, storageGB: 100 },
    },
  ]
}

const planVisuals: Record<string, { icon: React.ReactNode; headClass: string }> = {
  free: {
    headClass: 'subscription-plan-head--free',
    icon: <Zap size={22} />,
  },
  pro: {
    headClass: 'subscription-plan-head--pro',
    icon: <Crown size={22} />,
  },
  enterprise: {
    headClass: 'subscription-plan-head--enterprise',
    icon: <Building2 size={22} />,
  },
}

function checkoutButtonLabel(
  plan: Plan,
  paymentMethods: { alipay: boolean; wechat: boolean; stripe: boolean; publicWelfare: boolean },
  checkoutAvailable: boolean,
  t: (key: TranslationKey) => string,
): string {
  if (paymentMethods.publicWelfare && plan.price > 0) {
    return t('subscription.checkout.welfareIncluded')
  }
  if (plan.price === 0) return t('subscription.checkout.free')
  if (!checkoutAvailable) return t('subscription.checkout.beta')
  if (paymentMethods.alipay && !paymentMethods.wechat) return t('subscription.checkout.alipay')
  if (paymentMethods.wechat && !paymentMethods.alipay) return t('subscription.checkout.wechat')
  if (paymentMethods.alipay || paymentMethods.wechat) return t('subscription.checkout.cn')
  if (paymentMethods.stripe) return t('subscription.checkout.stripe')
  return t('subscription.checkout.upgrade')
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, currentPlan = 'free' }) => {
  const { t, language } = useI18n()
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
    publicWelfare: false,
  })
  const displayPlans = useMemo(
    () => localizePlans(plans.length > 0 ? plans : fallbackPlans, t),
    [plans, fallbackPlans, t],
  )
  const localizedPricingNote = useMemo(
    () => buildSubscriptionPricingNote(paymentMethods, t, language),
    [paymentMethods, t, language],
  )

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
    const paidPlan = sessionStorage.getItem(BILLING_SUCCESS_KEY)
    if (paidPlan) {
      sessionStorage.removeItem(BILLING_SUCCESS_KEY)
      setSuccess(t('subscription.paySuccessDetail', { plan: paidPlan }))
    }
  }, [t])

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
          publicWelfare?: boolean
        }>(r),
      )
      .then((data) => {
        if (data) {
          setPaymentMethods({
            alipay: Boolean(data.alipay),
            wechat: Boolean(data.wechat),
            stripe: Boolean(data.stripe),
            devMock: Boolean(data.devMock),
            publicWelfare: Boolean(data.publicWelfare),
          })
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

  const currentPlanInfo = useMemo(
    () => displayPlans.find((plan) => plan.name === currentPlan),
    [displayPlans, currentPlan],
  )
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

    const plan = displayPlans.find((p) => p.name === planName)
    if (!plan) return

    setError('')
    setSuccess('')

    if (paymentMethods.alipay || paymentMethods.wechat) {
      setCnPayPlan(plan)
      return
    }

    if (paymentMethods.stripe) {
      setProcessingPlanId(planId)
      try {
        const response = await fetch('/api/subscription/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ planId: planName }),
        })
        const data = await readJsonResponse<{ mode?: string; url?: string; error?: string }>(response)
        if (response.ok && data?.mode === 'stripe' && data.url && /^https?:\/\//i.test(data.url)) {
          window.location.href = data.url
          return
        }
        setError(data?.error || t('subscription.payFailed'))
      } catch {
        setError(t('subscription.payFailed'))
      } finally {
        setProcessingPlanId(null)
      }
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
        const data = await readJsonResponse<{
          mode?: string
          plan?: string
          message?: string
          messageKey?: string
          error?: string
        }>(response)
        if (response.ok && data?.mode === 'dev_mock' && data.plan) {
          subscriptionService.subscribeToPlan(data.plan)
          setCurrentPlan(data.plan)
          setSuccess(
            pickApiResponseMessage(data, t) || t('subscription.upgraded', { plan: data.plan }),
          )
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
      setSuccess(t('subscription.betaNote'))
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
        messageKey?: string
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
      setSuccess(pickApiResponseMessage(data, t) || t('subscription.updated'))
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
        messageKey?: string
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
      setSuccess(pickApiResponseMessage(data, t) || t('subscription.resumed'))
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
    new Date(subscription.currentPeriodEnd).toLocaleDateString(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  return (
    <>
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

          {localizedPricingNote && (checkoutAvailable || paymentMethods.publicWelfare) && (
            <AlertBanner variant="info">{localizedPricingNote}</AlertBanner>
          )}

          <p className="subscription-legal">
            <a
              href={language === 'en-US' ? '/legal/payment-en.html' : '/legal/payment.html'}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('subscription.legalPayment')}
            </a>
          </p>

          {checkoutAvailable &&
            (paymentMethods.alipay || paymentMethods.wechat || paymentMethods.stripe) && (
            <div className="subscription-payment-methods" role="list" aria-label={t('subscription.paymentMethods')}>
              {paymentMethods.stripe && (
                <span className="subscription-payment-method subscription-payment-method--stripe" role="listitem">
                  {t('subscription.payMethod.stripe')}
                </span>
              )}
              {paymentMethods.alipay && (
                <span className="subscription-payment-method subscription-payment-method--alipay" role="listitem">
                  {t('subscription.payMethod.alipay')}
                </span>
              )}
              {paymentMethods.wechat && (
                <span className="subscription-payment-method subscription-payment-method--wechat" role="listitem">
                  {t('subscription.payMethod.wechat')}
                </span>
              )}
            </div>
          )}

          {!checkoutAvailable && !loading && (
            <div className="subscription-beta-banner" role="status">
              {t('subscription.betaNote')}
            </div>
          )}

          {error && <AlertBanner variant="warning">{error}</AlertBanner>}

          {success && <AlertBanner variant="success">{success}</AlertBanner>}

          {isPaidPlan && subscription && (
            <div className="subscription-manage">
              <div className="subscription-manage-title">{t('subscription.manage.title')}</div>
              {subscription.cancelAtPeriodEnd ? (
                <div className="subscription-manage-status subscription-manage-status--warning">
                  {t('subscription.manage.cancelScheduled')}
                  {periodEndLabel
                    ? t('subscription.manage.cancelUntil', {
                        date: periodEndLabel,
                        plan: currentPlanInfo?.displayName || currentPlan,
                      })
                    : ''}
                </div>
              ) : (
                <div className="subscription-manage-status">
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
              {displayPlans.map((plan) => {
                const visual = planVisuals[plan.name] || planVisuals.free
                const isCurrent = plan.name === currentPlan
                const isProcessing = processingPlanId === plan.id

                const isPopular = plan.name === 'pro'

                return (
                  <div
                    key={plan.id}
                    className={`subscription-plan-card subscription-plan-card--${plan.name}${isCurrent ? ' subscription-plan-card--current' : ''}${isPopular && !isCurrent ? ' subscription-plan-card--popular' : ''}`}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    <div className={`subscription-plan-head ${visual.headClass}`}>
                      <div className="subscription-plan-head-top">
                        <div className="subscription-plan-icon">{visual.icon}</div>
                        <div className="subscription-plan-badges">
                          {isPopular && !isCurrent && (
                            <span className="subscription-plan-badge subscription-plan-badge--recommended">
                              {t('subscription.recommended')}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="subscription-plan-badge">{t('subscription.currentPlan')}</span>
                          )}
                        </div>
                      </div>
                      <div className="subscription-plan-name">{plan.displayName}</div>
                      <div className="subscription-plan-desc">{plan.description}</div>
                    </div>

                    <div className="subscription-plan-body">
                      <div className="subscription-plan-price-row">
                        <span className="subscription-plan-currency">
                          {plan.currency === 'CNY' ? '¥' : '$'}
                        </span>
                        <span className="subscription-plan-price">{plan.price}</span>
                        <span className="subscription-plan-period">{t('subscription.perMonth')}</span>
                      </div>

                      <div className="subscription-limits-grid">
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

                      <div className="subscription-features-grid">
                        {plan.features.map((feature) => (
                          <div key={feature} className="subscription-feature-row">
                            <Check size={15} className="subscription-feature-check" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="subscription-plan-footer">
                        <button
                          type="button"
                          className={`subscription-plan-cta ${isCurrent ? 'btn btn-secondary' : 'btn btn-primary'}`}
                          onClick={() => void handleSubscribe(plan.id, plan.name)}
                          disabled={
                            !!processingPlanId ||
                            isCurrent ||
                            (paymentMethods.publicWelfare && plan.price > 0)
                          }
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 size={16} className="spin" style={{ marginRight: '6px' }} />
                              {t('subscription.checkout.redirect')}
                            </>
                          ) : isCurrent ? (
                            t('subscription.checkout.current')
                          ) : (
                            checkoutButtonLabel(plan, paymentMethods, checkoutAvailable, t)
                          )}
                        </button>
                        {checkoutAvailable && plan.price > 0 && !isCurrent && paymentMethods.stripe && (
                          <p className="subscription-payment-hint">{t('subscription.checkout.stripeHint')}</p>
                        )}
                        {checkoutAvailable &&
                          plan.price > 0 &&
                          !isCurrent &&
                          paymentMethods.alipay &&
                          !paymentMethods.wechat &&
                          !paymentMethods.stripe && (
                            <p className="subscription-payment-hint">{t('subscription.checkout.alipayHint')}</p>
                          )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
    </ModalShell>
      {cnPayPlan && (
        <CnPayModal
          plan={cnPayPlan}
          alipay={paymentMethods.alipay}
          wechat={paymentMethods.wechat}
          onClose={() => setCnPayPlan(null)}
          onSuccess={() => {
            void loadSubscription()
            setSuccess(t('subscription.paySuccess'))
          }}
        />
      )}
    </>
  )
}

export default SubscriptionModal
