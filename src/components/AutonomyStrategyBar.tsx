import { memo, useCallback, useMemo } from 'react'
import { Bot, Pause, Play, Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'
import { buildAutonomyStrategyUiState, resolveAutonomyModeKey } from '../lib/autonomyStrategyUi'
import {
  collectLinkageAutonomyContext,
  evaluateLinkageAutonomy,
} from '../lib/linkageAutonomyContext'
import { useIDEStore } from '../store/ideStore'
import { LinkageBecauseStrip } from './LinkageBecauseStrip'
import { serializeLinkageReasons } from '../lib/linkageReason'

interface AutonomyStrategyBarProps {
  focusTasksPath?: string | null
  openTaskCount: number
  gitModifiedCount: number
  queueBusy: boolean
  quotaBlocked: boolean
  backgroundAgentEnabled: boolean
  loopActive: boolean
  loopProgress?: { completed: number; total: number } | null
  backgroundWatchActive: boolean
  backgroundProgress?: { queued: number; remaining: number } | null
  goalDriveActive: boolean
  onRunNext?: () => void
  onStartLoop?: () => void
  onPauseLoop?: () => void
  onStartBackground?: () => void
  onPauseBackground?: () => void
  onPauseGoalDrive?: () => void
  taskPreview?: string | null
}

export const AutonomyStrategyBar = memo(function AutonomyStrategyBar({
  focusTasksPath,
  openTaskCount,
  gitModifiedCount,
  queueBusy,
  quotaBlocked,
  backgroundAgentEnabled,
  loopActive,
  loopProgress,
  backgroundWatchActive,
  backgroundProgress,
  goalDriveActive,
  onRunNext,
  onStartLoop,
  onPauseLoop,
  onStartBackground,
  onPauseBackground,
  onPauseGoalDrive,
  taskPreview,
}: AutonomyStrategyBarProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)

  const strategy = useMemo(() => {
    const ctx = collectLinkageAutonomyContext({
      files,
      tasksPath: focusTasksPath ?? null,
      openTaskCount,
      gitModifiedCount,
      queueBusy,
      quotaBlocked,
    })
    const policy = evaluateLinkageAutonomy(ctx)
    return buildAutonomyStrategyUiState({
      policy,
      loopActive,
      backgroundWatchActive,
      goalDriveActive,
      openTaskCount,
      quotaBlocked,
    })
  }, [
    files,
    focusTasksPath,
    openTaskCount,
    gitModifiedCount,
    queueBusy,
    quotaBlocked,
    loopActive,
    backgroundWatchActive,
    goalDriveActive,
  ])

  const handlePrimary = useCallback(() => {
    if (goalDriveActive) {
      onPauseGoalDrive?.()
      return
    }
    if (loopActive) {
      onPauseLoop?.()
      return
    }
    if (backgroundWatchActive) {
      onPauseBackground?.()
      return
    }
    if (!strategy.canExecute) return
    if (strategy.policy.mode === 'background') {
      onStartBackground?.()
      return
    }
    if (strategy.policy.mode === 'foreground') {
      if (openTaskCount > 1) onStartLoop?.()
      else onRunNext?.()
    }
  }, [
    backgroundWatchActive,
    goalDriveActive,
    loopActive,
    onPauseBackground,
    onPauseGoalDrive,
    onPauseLoop,
    onRunNext,
    onStartBackground,
    onStartLoop,
    openTaskCount,
    strategy.canExecute,
    strategy.policy.mode,
  ])

  if (openTaskCount <= 0 && !goalDriveActive && !loopActive && !backgroundWatchActive) return null

  const modeLabel = t(resolveAutonomyModeKey(strategy.policy.mode))
  const progressHint =
    loopActive && loopProgress
      ? t('intent.autopilot.loopPause', {
          completed: loopProgress.completed,
          total: loopProgress.total,
        })
      : backgroundWatchActive && backgroundProgress
        ? t('intent.autopilot.backgroundPause', {
            queued: backgroundProgress.queued,
            remaining: backgroundProgress.remaining,
          })
        : null

  return (
    <div className="autonomy-strategy-bar" data-testid="autonomy-strategy-bar">
      <div className="autonomy-strategy-bar__head">
        <Sparkles size={12} />
        <span className="autonomy-strategy-bar__title">{t('linkage.autonomy.title')}</span>
        <span className="autonomy-strategy-bar__mode" data-testid="autonomy-strategy-mode">
          {modeLabel}
        </span>
        {strategy.activeChannel ? (
          <span className="autonomy-strategy-bar__channel">
            {t('linkage.autonomy.running', {
              channel: t(
                strategy.activeChannel === 'loop'
                  ? 'linkage.autonomy.channel.loop'
                  : strategy.activeChannel === 'background'
                    ? 'linkage.autonomy.channel.background'
                    : 'linkage.autonomy.channel.goal',
              ),
            })}
          </span>
        ) : null}
      </div>
      <LinkageBecauseStrip
        becauseRaw={serializeLinkageReasons(strategy.policy.reasons)}
        compact
      />
      <div className="autonomy-strategy-bar__actions">
        <button
          type="button"
          className={`intent-shell-bar__action intent-shell-bar__action--strategy ${
            strategy.activeChannel ? 'intent-shell-bar__action--loop' : 'intent-shell-bar__action--accent'
          }`}
          data-testid="autonomy-strategy-primary"
          title={taskPreview ?? undefined}
          disabled={!strategy.canExecute && !strategy.activeChannel}
          onClick={handlePrimary}
        >
          {strategy.activeChannel ? <Pause size={12} /> : <Play size={12} />}
          {progressHint ?? t(strategy.executeModeKey)}
        </button>
        {onRunNext && taskPreview && !strategy.activeChannel && strategy.policy.mode !== 'pause' ? (
          <button
            type="button"
            className="intent-shell-bar__action"
            data-testid="autonomy-strategy-manual-next"
            onClick={onRunNext}
            disabled={quotaBlocked || loopActive}
            title={taskPreview}
          >
            {t('linkage.autonomy.manualNext')}
          </button>
        ) : null}
        {backgroundAgentEnabled && strategy.policy.mode === 'foreground' && !strategy.activeChannel ? (
          <span className="autonomy-strategy-bar__hint">
            <Bot size={11} />
            {t('linkage.autonomy.foregroundHint')}
          </span>
        ) : null}
      </div>
    </div>
  )
})
