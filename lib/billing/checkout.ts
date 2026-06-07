/** Client/server shared flags for subscription checkout availability. */
export type PaymentMethodsFlags = {
  alipay?: boolean
  wechat?: boolean
  stripe?: boolean
  paddle?: boolean
  devMock?: boolean
  publicWelfare?: boolean
}

export function hasCheckoutPayment(methods: PaymentMethodsFlags): boolean {
  if (methods.publicWelfare) return false
  return Boolean(methods.alipay || methods.wechat || methods.stripe || methods.paddle || methods.devMock)
}

export const BETA_BILLING_NOTE =
  '当前为公测期，专业版与团队版功能免费开放；正式收款接入后将在此开启升级。'

export const PUBLIC_WELFARE_BILLING_NOTE =
  '公益免费 IDE：永久不收取订阅费，感谢使用与传播。'
