import type { AutonomyMode, AutonomyPolicyResult } from './autonomyPolicy'
import type { TranslationKey } from '../i18n'

export type AutonomyActiveChannel = 'loop' | 'background' | 'goal-drive' | null

export interface AutonomyStrategyUiState {
  policy: AutonomyPolicyResult
  activeChannel: AutonomyActiveChannel
  canExecute: boolean
  executeModeKey: TranslationKey
  pauseModeKey: TranslationKey | null
}

export function detectAutonomyActiveChannel(input: {
  loopActive: boolean
  backgroundWatchActive: boolean
  goalDriveActive: boolean
}): AutonomyActiveChannel {
  if (input.goalDriveActive) return 'goal-drive'
  if (input.backgroundWatchActive) return 'background'
  if (input.loopActive) return 'loop'
  return null
}

const MODE_KEY: Record<AutonomyMode, TranslationKey> = {
  background: 'linkage.policy.mode.background',
  foreground: 'linkage.policy.mode.foreground',
  pause: 'linkage.policy.mode.pause',
  'hint-only': 'linkage.policy.mode.hint',
}

const ACTIVE_CHANNEL_KEY: Record<Exclude<AutonomyActiveChannel, null>, TranslationKey> = {
  loop: 'linkage.autonomy.channel.loop',
  background: 'linkage.autonomy.channel.background',
  'goal-drive': 'linkage.autonomy.channel.goal',
}

export function resolveAutonomyModeKey(mode: AutonomyMode): TranslationKey {
  return MODE_KEY[mode]
}

export function resolveAutonomyActiveChannelKey(channel: AutonomyActiveChannel): TranslationKey | null {
  if (!channel) return null
  return ACTIVE_CHANNEL_KEY[channel]
}

/** Map policy + runtime state to unified strategy bar labels. */
export function buildAutonomyStrategyUiState(input: {
  policy: AutonomyPolicyResult
  loopActive: boolean
  backgroundWatchActive: boolean
  goalDriveActive: boolean
  openTaskCount: number
  quotaBlocked: boolean
}): AutonomyStrategyUiState {
  const activeChannel = detectAutonomyActiveChannel(input)
  const mode = input.policy.mode

  if (activeChannel) {
    return {
      policy: input.policy,
      activeChannel,
      canExecute: true,
      executeModeKey: 'linkage.autonomy.pause',
      pauseModeKey: resolveAutonomyActiveChannelKey(activeChannel),
    }
  }

  if (input.quotaBlocked || mode === 'pause' || mode === 'hint-only' || input.openTaskCount <= 0) {
    return {
      policy: input.policy,
      activeChannel: null,
      canExecute: false,
      executeModeKey: resolveAutonomyModeKey(mode),
      pauseModeKey: null,
    }
  }

  return {
    policy: input.policy,
    activeChannel: null,
    canExecute: true,
    executeModeKey:
      mode === 'background' ? 'linkage.autonomy.executeBackground' : 'linkage.autonomy.executeForeground',
    pauseModeKey: null,
  }
}
