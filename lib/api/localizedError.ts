import { apiMessage, type ApiErrorKey, type ApiMessageKey } from '../i18n/apiMessages'
import { resolveRequestLocale } from '../i18n/resolveLocale'
import { jsonResponse } from './http'

/** Attach localized `message` + `messageKey` for client display (follows request locale). */
export function appendApiMessage<T extends Record<string, unknown>>(
  req: Request | undefined,
  key: ApiMessageKey,
  body: T,
  params?: Record<string, string | number>,
): T & { message: string; messageKey: ApiMessageKey } {
  const locale = resolveRequestLocale(req)
  return {
    ...body,
    message: apiMessage(key, locale, params),
    messageKey: key,
  }
}

export function localizedSuccessResponse(
  req: Request | undefined,
  key: ApiMessageKey,
  body: Record<string, unknown> = { success: true },
  status = 200,
  params?: Record<string, string | number>,
  headers?: Record<string, string>,
): Response {
  return jsonResponse(appendApiMessage(req, key, body, params), status, headers)
}

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
