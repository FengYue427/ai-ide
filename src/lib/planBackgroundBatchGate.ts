import { getClientEntitlements } from './clientPlanEntitlements'

export type PlanBackgroundBatchGateResult =
  | { ok: true; batchMax: number; effectiveCount: number; truncated: boolean }
  | { ok: false; reason: 'upgrade-required' }
  | { ok: false; reason: 'empty-steps' }

export function gatePlanBackgroundBatch(
  planName: string,
  stepCount: number,
): PlanBackgroundBatchGateResult {
  if (stepCount <= 0) return { ok: false, reason: 'empty-steps' }
  const batchMax = getClientEntitlements(planName).backgroundJobsBatchMax
  if (batchMax <= 0) return { ok: false, reason: 'upgrade-required' }
  const effectiveCount = Math.min(stepCount, batchMax)
  return { ok: true, batchMax, effectiveCount, truncated: stepCount > batchMax }
}
