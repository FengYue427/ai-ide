import type { TranslationKey } from '../i18n'
import type { AutonomyMode, AutonomyPolicyResult } from './autonomyPolicy'
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

function autonomyBlockedTitleKey(
  channel: 'loop' | 'background',
  mode: AutonomyMode,
): TranslationKey {
  if (channel === 'loop') return 'intent.autopilot.loopBlockedTitle'
  if (mode === 'foreground') return 'intent.autopilot.backgroundForegroundTitle'
  return 'intent.autopilot.backgroundBlockedTitle'
}

/** Toast copy when E1/E2 start is rejected by autonomy policy. */
export function formatAutonomyStartBlockedFeedback(
  policy: AutonomyPolicyResult,
  t: TranslateFn,
  channel: 'loop' | 'background',
): { title: string; detail: string } | null {
  if (channel === 'loop') {
    if (policy.mode !== 'pause' && policy.mode !== 'hint-only') return null
  } else if (policy.mode === 'background') {
    return null
  }

  return formatAutonomyPauseFeedback(policy, t, {
    titleKey: autonomyBlockedTitleKey(channel, policy.mode),
  })
}
