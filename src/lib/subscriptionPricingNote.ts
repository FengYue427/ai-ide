import type { Language, TranslateFn } from '../i18n'
import type { PaymentMethodsFlags } from '../../lib/billing/checkout'

export function buildSubscriptionPricingNote(
  methods: PaymentMethodsFlags,
  t: TranslateFn,
  language: Language,
): string {
  if (methods.alipay || methods.wechat || methods.stripe) {
    const parts: string[] = []
    if (methods.alipay) parts.push(t('subscription.payMethod.alipay'))
    if (methods.wechat) parts.push(t('subscription.payMethod.wechat'))
    if (methods.stripe) parts.push(t('subscription.payMethod.stripe'))
    const separator = language === 'zh-CN' ? '、' : ', '
    return t('subscription.pricing.live', { methods: parts.join(separator) })
  }
  if (methods.devMock) return t('subscription.pricing.dev')
  return t('subscription.betaNote')
}
