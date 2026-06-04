/**
 * Public-welfare IDE: no paid checkout; generous quotas for all users.
 * Enable with PUBLIC_WELFARE_MODE=true (server) and VITE_PUBLIC_WELFARE=true (client build).
 */

export const PUBLIC_WELFARE_PLAN = 'pro'

export function isPublicWelfareMode(): boolean {
  const raw = process.env.PUBLIC_WELFARE_MODE?.trim().toLowerCase()
  if (raw === 'true' || raw === '1' || raw === 'yes') return true
  if (raw === 'false' || raw === '0' || raw === 'no') return false
  return false
}

/** Effective plan for quota / feature gates when welfare mode is on. */
export function effectivePlanName(actualPlan: string): string {
  if (!isPublicWelfareMode()) return actualPlan
  return PUBLIC_WELFARE_PLAN
}

export const PUBLIC_WELFARE_NOTE_ZH =
  '公益免费 IDE：不收取订阅费，平台 AI 配额已放宽。欢迎 BYOK 使用自有模型 Key。'

export const PUBLIC_WELFARE_NOTE_EN =
  'Public-welfare IDE: no subscription fees. Platform AI quotas are generous. BYOK supported.'
