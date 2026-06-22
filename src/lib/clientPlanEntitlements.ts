import {
  getEntitlements,
  isEntitlementEnabled,
  type EntitlementFeature,
  type PlanEntitlements,
} from '../../lib/billing/entitlements'
import { isPublicWelfareClient } from './publicWelfare'

export function getClientEffectivePlanName(planName: string): string {
  if (isPublicWelfareClient()) return 'pro'
  return planName
}

export function getClientEntitlements(planName: string): PlanEntitlements {
  return getEntitlements(getClientEffectivePlanName(planName))
}

export function isClientEntitlementEnabled(planName: string, feature: EntitlementFeature): boolean {
  return isEntitlementEnabled(getClientEffectivePlanName(planName), feature)
}

const FULL_SESSION_RESUME_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const FREE_SESSION_RESUME_MAX_AGE_MS = 24 * 60 * 60 * 1000

export function getSessionResumeMaxAgeMs(planName: string): number {
  return isClientEntitlementEnabled(planName, 'fullSessionResume')
    ? FULL_SESSION_RESUME_MAX_AGE_MS
    : FREE_SESSION_RESUME_MAX_AGE_MS
}
