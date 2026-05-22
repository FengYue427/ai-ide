import type { TranslateFn, TranslationKey } from '../i18n'

const PLAN_IDS = ['free', 'pro', 'enterprise'] as const
type PlanId = (typeof PLAN_IDS)[number]

function isPlanId(name: string): name is PlanId {
  return (PLAN_IDS as readonly string[]).includes(name)
}

export interface LocalizablePlan {
  name: string
  displayName: string
  description: string
  features: string[]
}

export function localizePlan<T extends LocalizablePlan>(plan: T, t: TranslateFn): T {
  if (!isPlanId(plan.name)) return plan
  const id = plan.name
  const featureKeys = [`subscription.plan.${id}.f1`, `subscription.plan.${id}.f2`, `subscription.plan.${id}.f3`] as const
  return {
    ...plan,
    displayName: t(`subscription.plan.${id}.name` as TranslationKey),
    description: t(`subscription.plan.${id}.desc` as TranslationKey),
    features: featureKeys.map((key) => t(key)),
  }
}

export function localizePlans<T extends LocalizablePlan>(plans: T[], t: TranslateFn): T[] {
  return plans.map((plan) => localizePlan(plan, t))
}
