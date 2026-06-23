import type { TranslationKey } from '../i18n'
import type { AutonomyPolicyResult } from './autonomyPolicy'
import { linkageReasonLabelKey } from './linkageReason'
import { resolveAutonomyModeKey } from './autonomyStrategyUi'

type TranslateFn = (key: TranslationKey, params?: Record<string, string>) => string

export function formatAutonomyPauseFeedback(
  policy: AutonomyPolicyResult,
  t: TranslateFn,
  options?: { titleKey?: TranslationKey; specCreated?: boolean },
): { title: string; detail: string } {
  const modeKey = resolveAutonomyModeKey(policy.mode)
  const because = policy.reasons
    .slice(-4)
    .map((reason) => {
      const key = linkageReasonLabelKey(reason.id)
      return reason.detail ? t(key, { detail: reason.detail }) : t(key)
    })
    .join(' · ')

  const detailKey = options?.specCreated
    ? 'intent.autopilot.autonomyBlockedDetailSpecReady'
    : 'intent.autopilot.autonomyBlockedDetail'

  return {
    title: t(options?.titleKey ?? 'intent.autopilot.autonomyBlockedTitle'),
    detail: t(detailKey, {
      mode: t(modeKey),
      because,
    }),
  }
}
