import { getPublicAppOrigin, isCustomAppOrigin } from './appOrigin'

export function getRuntimeHostname(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.location.hostname.toLowerCase()
  } catch {
    return ''
  }
}

export function isIpAddressHost(host: string): boolean {
  if (!host) return false
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true
  if (host.includes(':') && !host.includes('.')) return true
  return false
}

export function isIpDeployHost(): boolean {
  return isIpAddressHost(getRuntimeHostname())
}

/** Aliyun / custom domain — not vercel.app or localhost dev. */
export function isSelfHostedDeploy(): boolean {
  const origin = getPublicAppOrigin()
  if (origin && isCustomAppOrigin(origin)) return true
  return isIpDeployHost()
}

export function isCnSelfHostedDeploy(): boolean {
  return isSelfHostedDeploy()
}

export function resolveIcpBeian(): string | null {
  const icp = (import.meta.env.VITE_ICP_BEIAN as string | undefined)?.trim()
  return icp || null
}
