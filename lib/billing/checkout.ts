/** Client/server shared flags for subscription checkout availability. */
export type PaymentMethodsFlags = {
  alipay?: boolean
  wechat?: boolean
  stripe?: boolean
  devMock?: boolean
}

export function hasCheckoutPayment(methods: PaymentMethodsFlags): boolean {
  return Boolean(methods.alipay || methods.wechat || methods.stripe || methods.devMock)
}

export const BETA_BILLING_NOTE =
  '当前为公测期，专业版与团队版功能免费开放；正式收款接入后将在此开启升级。'
