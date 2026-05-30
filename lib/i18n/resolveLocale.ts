export type ApiLocale = 'zh-CN' | 'en-US' | 'ja-JP'

const APP_LANGUAGE_HEADER = 'x-app-language'

/** Resolve locale from client header or Accept-Language (defaults to zh-CN). */
export function resolveRequestLocale(req?: Request | null): ApiLocale {
  if (!req) return 'zh-CN'

  const appLang = req.headers.get(APP_LANGUAGE_HEADER)?.trim().toLowerCase()
  if (appLang === 'en-us' || appLang === 'en') return 'en-US'
  if (appLang === 'ja-jp' || appLang === 'ja') return 'ja-JP'
  if (appLang === 'zh-cn' || appLang === 'zh') return 'zh-CN'

  const accept = req.headers.get('accept-language')?.toLowerCase() ?? ''
  if (/\bja(-jp)?\b/.test(accept) && !/\bzh\b/.test(accept.split(',')[0] ?? '')) {
    return 'ja-JP'
  }
  if (/\ben(-us)?\b/.test(accept) && !/\bzh\b/.test(accept.split(',')[0] ?? '')) {
    return 'en-US'
  }

  return 'zh-CN'
}
