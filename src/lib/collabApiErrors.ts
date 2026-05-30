import type { TranslateFn } from '../i18n'

/** Map collab REST failures to user-facing copy (v1.1.3.6). */
export function formatCollabApiError(
  status: number | undefined,
  serverMessage: string | undefined,
  fallback: string,
  t: TranslateFn,
): string {
  if (serverMessage?.trim()) return serverMessage.trim()

  switch (status) {
    case 401:
      return t('collab.m1.error.unauthorized')
    case 403:
      return t('collab.m1.error.forbidden')
    case 404:
      return t('collab.m1.error.notFound')
    case 409:
      return t('collab.m1.error.conflict')
    case 413:
      return t('collab.m1.error.payloadTooLarge')
    case 429:
      return t('collab.m1.error.rateLimited')
    case 503:
      return t('collab.m1.error.unavailable')
    case 500:
    case 502:
    case 504:
      return t('collab.m1.error.server')
    default:
      return fallback
  }
}
