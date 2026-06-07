/** Prefer Alipay/WeChat checkout for mainland-style locales. */
export function preferCnBillingCheckout(locale?: string): boolean {
  const raw = (locale ?? '').trim().toLowerCase()
  if (!raw) return false
  if (raw.startsWith('zh-cn') || raw === 'zh-hans' || raw === 'zh') return true
  if (raw.startsWith('zh') && !raw.includes('tw') && !raw.includes('hk') && !raw.includes('hant')) {
    return true
  }
  return false
}

/** Browser helper — uses navigator.language when available. */
export function preferCnBillingCheckoutInBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return preferCnBillingCheckout(navigator.language)
}
