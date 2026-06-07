import type { Language, TranslateFn } from '../i18n'
import type { PaymentMethodsFlags } from '../../lib/billing/checkout'
import { preferCnBillingCheckout } from '../../lib/billing/billingRegion'
import { isOverseasCheckoutDeferred } from '../../lib/billing/overseasCheckout'
import { isPublicWelfareClient } from './publicWelfare'

function isOverseasOnly(methods: PaymentMethodsFlags): boolean {
  return Boolean((methods.paddle || methods.stripe) && !methods.alipay && !methods.wechat)
}

export function buildSubscriptionPricingNote(
  methods: PaymentMethodsFlags,
  t: TranslateFn,
  language: Language,
): string {
  if (methods.publicWelfare || isPublicWelfareClient()) {
    return t('subscription.pricing.publicWelfare')
  }

  const useCnCheckout =
    preferCnBillingCheckout(language) && Boolean(methods.alipay || methods.wechat)

  if (isOverseasCheckoutDeferred(methods, useCnCheckout)) {
    if (methods.alipay || methods.wechat) {
      const parts: string[] = []
      if (methods.alipay) parts.push(t('subscription.payMethod.alipay'))
      if (methods.wechat) parts.push(t('subscription.payMethod.wechat'))
      const separator = language === 'zh-CN' ? '、' : ', '
      return t('subscription.pricing.cnWithOverseasSoon', { methods: parts.join(separator) })
    }
    return t('subscription.overseasComingSoon')
  }

  if (methods.alipay || methods.wechat || methods.stripe || methods.paddle) {
    const parts: string[] = []
    if (methods.alipay) parts.push(t('subscription.payMethod.alipay'))
    if (methods.wechat) parts.push(t('subscription.payMethod.wechat'))
    if (methods.paddle) parts.push(t('subscription.payMethod.paddle'))
    if (methods.stripe) parts.push(t('subscription.payMethod.stripe'))
    const separator = language === 'zh-CN' ? '、' : ', '
    if (isOverseasOnly(methods)) {
      return t('subscription.pricing.liveStripe', { methods: parts.join(separator) })
    }
    return t('subscription.pricing.live', { methods: parts.join(separator) })
  }
  if (methods.devMock) return t('subscription.pricing.dev')
  return t('subscription.betaNote')
}
