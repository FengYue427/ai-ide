import type { PaymentMethodsFlags } from './checkout'

/** Paddle / Stripe MoR checkout for non-CN locales. */
export function hasOverseasMoRCheckout(methods: PaymentMethodsFlags): boolean {
  return Boolean(methods.paddle || methods.stripe)
}

/**
 * v1.6 Plan B: CN billing works but overseas paid checkout is not live yet.
 * User should use Free + BYOK until Lemon Squeezy / Polar lands in v1.6.1.
 */
export function isOverseasCheckoutDeferred(
  methods: PaymentMethodsFlags,
  useCnCheckout: boolean,
): boolean {
  if (useCnCheckout) return false
  if (methods.publicWelfare || methods.devMock) return false
  return !hasOverseasMoRCheckout(methods)
}
