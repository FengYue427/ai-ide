import { apiMessage, type ApiErrorKey } from '../i18n/apiMessages'
import { resolveRequestLocale } from '../i18n/resolveLocale'
import { jsonResponse } from './http'

export function localizedErrorResponse(
  req: Request | undefined,
  key: ApiErrorKey,
  status = 400,
  params?: Record<string, string | number>,
  headers?: Record<string, string>,
): Response {
  const locale = resolveRequestLocale(req)
  return jsonResponse({ error: apiMessage(key, locale, params), errorKey: key }, status, headers)
}

export function authJsonError(req: Request, key: ApiErrorKey, status: number): Response {
  const locale = resolveRequestLocale(req)
  return new Response(
    JSON.stringify({ error: apiMessage(key, locale), errorKey: key }),
    { status, headers: { 'Content-Type': 'application/json' } },
  )
}
