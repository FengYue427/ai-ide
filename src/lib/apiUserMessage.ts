import type { TranslateFn, TranslationKey } from '../i18n'

export type ApiResponseMessagePayload = {
  message?: string
  messageKey?: string
}

/** Client fallback when only messageKey is present (server should send localized message). */
const MESSAGE_KEY_TO_CLIENT: Partial<Record<string, TranslationKey>> = {
  'api.auth.loginOk': 'auth.success.login',
  'api.auth.registerOk': 'auth.success.register',
  'api.auth.signoutOk': 'auth.success.signout',
  'api.auth.oauthSyncOk': 'auth.success.oauthSync',
  'api.auth.forgotDemoMessage': 'auth.forgot.demoMessage',
  'api.workspace.created': 'workspace.success.created',
  'api.workspace.saved': 'workspace.success.saved',
  'api.workspace.deleted': 'workspace.success.deleted',
  'api.payment.simulateOk': 'payment.success.simulate',
  'api.checkout.devUpgraded': 'subscription.upgraded',
  'api.subscription.cancelImmediate': 'subscription.updated',
  'api.subscription.cancelScheduled': 'subscription.updated',
  'api.subscription.cancelDoneNow': 'subscription.updated',
  'api.subscription.cancelEndOfPeriod': 'subscription.updated',
  'api.subscription.resumeActive': 'subscription.resumed',
  'api.subscription.resumeOk': 'subscription.resumed',
}

/**
 * Prefer server-localized `message` (via X-App-Language); optional client `t()` fallback from messageKey.
 */
export function pickApiResponseMessage(
  payload: ApiResponseMessagePayload | null | undefined,
  t?: TranslateFn,
): string | undefined {
  if (payload?.message?.trim()) return payload.message.trim()
  if (payload?.messageKey && t) {
    const clientKey = MESSAGE_KEY_TO_CLIENT[payload.messageKey]
    if (clientKey) return t(clientKey)
  }
  return undefined
}
