import { memo, useMemo } from 'react'
import { AlertTriangle, FileCheck2, GitBranch, ListOrdered } from 'lucide-react'
import { useI18n } from '../i18n'
import { buildSpecStatusSummary } from '../lib/specStatusSummary'
import { buildRuntimeStatePreview } from '../services/runtime/runtimeStatePreview'
import { buildDriftResolutionActions } from '../services/intentOs/driftResolutionService'
import { isIntentLinkageLocked, isPlanGatedTierCEnabled, isTierCFeatureLocked } from '../lib/planFeatureGate'
import { IntentGroundingBanner } from './intent/IntentGroundingBanner'
import { AutopilotQuotaBar } from './AutopilotQuotaBar'
import { AutonomyStrategyBar } from './AutonomyStrategyBar'
import { UpgradeEntitlementHint } from './UpgradeEntitlementHint'
import { useIDEStore, type LastGroundingBlock } from '../store/ideStore'
import type { AutopilotQuota } from '../services/autopilotUsageService'

interface IntentShellBarProps {
  onOpenPath: (path: string) => void
  onSaveProof?: () => void
  onToggleShell: () => void
  onRunAutopilotNext?: () => void
  onStartAutopilotLoop?: () => void
  onPauseAutopilotLoop?: () => void
  onStartBackgroundWatch?: () => void
  onPauseBackgroundWatch?: () => void
  onOpenGoalDrive?: () => void
  onPauseGoalDrive?: () => void
  goalDriveActive?: boolean
  autopilotLoopActive?: boolean
  autopilotLoopProgress?: { completed: number; total: number } | null
  autopilotBackgroundWatchActive?: boolean
  autopilotBackgroundProgress?: { queued: number; remaining: number } | null
  backgroundAgentEnabled?: boolean
  autopilotTaskPreview?: string | null
  autopilotOpenCount?: number
  autopilotQuota?: AutopilotQuota | null
  autopilotQuotaBlocked?: boolean
  linkageGitModifiedCount?: number
  linkageQueueBusy?: boolean
  lastGroundingBlock?: LastGroundingBlock | null
  onDismissGroundingBlock?: () => void
  narrowLayout?: boolean
  railTab?: 'graph' | 'queue'
  onRailTabChange?: (tab: 'graph' | 'queue') => void
  graphRailOpen?: boolean
  queueRailOpen?: boolean
  onReopenGraph?: () => void
  onReopenQueue?: () => void
}

export const IntentShellBar = memo(function IntentShellBar({
  onOpenPath,
  onSaveProof,
  onToggleShell,
  onRunAutopilotNext,
  onStartAutopilotLoop,
  onPauseAutopilotLoop,
  onStartBackgroundWatch,
  onPauseBackgroundWatch,
  onOpenGoalDrive,
  onPauseGoalDrive,
  goalDriveActive = false,
  autopilotLoopActive = false,
  autopilotLoopProgress = null,
  autopilotBackgroundWatchActive = false,
  autopilotBackgroundProgress = null,
  backgroundAgentEnabled = false,
  autopilotTaskPreview,
  autopilotOpenCount = 0,
  autopilotQuota = null,
  autopilotQuotaBlocked = false,
  linkageGitModifiedCount = 0,
  linkageQueueBusy = false,
  lastGroundingBlock,
  onDismissGroundingBlock,
  narrowLayout = false,
  railTab = 'queue',
  onRailTabChange,
  graphRailOpen = true,
  queueRailOpen = true,
  onReopenGraph,
  onReopenQueue,
}: IntentShellBarProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const currentUser = useIDEStore((s) => s.currentUser)
  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)
  const specDriftReports = useIDEStore((s) => s.specDriftReports)
  const queuedSpecBackfill = useIDEStore((s) => s.queuedSpecBackfill)
  const verifyingSpecBackfill = useIDEStore((s) => s.verifyingSpecBackfill)
  const failedSpecExecution = useIDEStore((s) => s.failedSpecExecution)

  const specStatus = useMemo(() => buildSpecStatusSummary(files), [files])
  const activePath = buildRuntimeStatePreview(files).activeSpecPath ?? specStatus.runnableTasksPath
  const driftReport = activePath ? specDriftReports[activePath.replace(/\\/g, '/')] : null
  const driftLocked = isIntentLinkageLocked()
  const driftActions = useMemo(() => {
    if (!driftReport || driftReport.severity === 'none') return []
    return buildDriftResolutionActions(driftReport, files).slice(0, narrowLayout ? 2 : 4)
  }, [driftReport, files, narrowLayout])
  const driftInteractive = !driftLocked && isPlanGatedTierCEnabled('driftResolution')
  const groundingLocked = lastGroundingBlock ? isTierCFeatureLocked('groundingGateV2') : false

  const queueStage = failedSpecExecution
    ? t('intent.shell.stage.failed')
    : verifyingSpecBackfill
      ? t('intent.shell.stage.verify')
      : queuedSpecBackfill
        ? t('intent.shell.stage.running')
        : t('intent.shell.stage.idle')

  return (
    <div className="intent-shell-bar" data-testid="intent-shell-bar">
      <div className="intent-shell-bar__group">
        <GitBranch size={13} />
        <span>{t('intent.shell.barTitle')}</span>
        {specStatus.activeSpecSlug ? (
          <span className="intent-shell-bar__chip">{specStatus.activeSpecSlug}</span>
        ) : null}
      </div>
      <div className="intent-shell-bar__group">
        <ListOrdered size={13} />
        <span>{queueStage}</span>
      </div>
      {narrowLayout && onRailTabChange ? (
        <div className="intent-shell-bar__tabs" data-testid="intent-shell-rail-tabs">
          <button
            type="button"
            className={`intent-shell-bar__tab ${railTab === 'graph' ? 'intent-shell-bar__tab--active' : ''}`}
            data-testid="intent-shell-tab-graph"
            onClick={() => onRailTabChange('graph')}
          >
            {t('intent.shell.graphTitle')}
          </button>
          <button
            type="button"
            className={`intent-shell-bar__tab ${railTab === 'queue' ? 'intent-shell-bar__tab--active' : ''}`}
            data-testid="intent-shell-tab-queue"
            onClick={() => onRailTabChange('queue')}
          >
            {t('intent.shell.queueTitle')}
          </button>
        </div>
      ) : null}
      {driftReport && driftReport.severity !== 'none' && driftActions.length > 0 ? (
        <div className="intent-shell-bar__drift" data-testid="intent-shell-drift-actions">
          <span className="intent-shell-bar__drift-label">
            <AlertTriangle size={12} />
            {t('intent.drift.title')}
          </span>
          {driftActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="intent-shell-bar__action intent-shell-bar__action--warn"
              data-testid={`intent-shell-drift-${action.kind}`}
              disabled={!driftInteractive}
              onClick={() => driftInteractive && action.path && onOpenPath(action.path)}
            >
              {t(action.labelKey)}
            </button>
          ))}
          {driftLocked ? (
            <UpgradeEntitlementHint
              messageKey="entitlements.upgrade.intentLinkage"
              onUpgrade={currentUser ? () => setShowSubscriptionModal(true) : undefined}
              compact
            />
          ) : null}
        </div>
      ) : null}
      {lastGroundingBlock ? (
        <div className="intent-shell-bar__grounding" data-testid="intent-shell-grounding-wrap">
          <IntentGroundingBanner
            block={lastGroundingBlock}
            onDismiss={onDismissGroundingBlock}
            variant="inline"
            testId="intent-shell-grounding-block"
          />
          {groundingLocked ? (
            <UpgradeEntitlementHint
              messageKey="entitlements.upgrade.intentLinkage"
              onUpgrade={currentUser ? () => setShowSubscriptionModal(true) : undefined}
              compact
            />
          ) : null}
        </div>
      ) : null}
      {onOpenGoalDrive && onPauseGoalDrive ? (
        goalDriveActive ? (
          <button
            type="button"
            className="intent-shell-bar__action intent-shell-bar__action--goal"
            data-testid="intent-shell-goal-drive-pause"
            onClick={onPauseGoalDrive}
          >
            {t('intent.autopilot.goalDrivePause')}
          </button>
        ) : (
          <button
            type="button"
            className="intent-shell-bar__action intent-shell-bar__action--goal"
            data-testid="intent-shell-goal-drive"
            onClick={onOpenGoalDrive}
            disabled={autopilotQuotaBlocked || autopilotLoopActive || autopilotBackgroundWatchActive}
          >
            {t('intent.autopilot.goalDriveStart')}
          </button>
        )
      ) : null}
      {onRunAutopilotNext && autopilotTaskPreview ? (
        <AutonomyStrategyBar
          focusTasksPath={activePath}
          openTaskCount={autopilotOpenCount}
          gitModifiedCount={linkageGitModifiedCount}
          queueBusy={linkageQueueBusy}
          quotaBlocked={autopilotQuotaBlocked}
          backgroundAgentEnabled={backgroundAgentEnabled}
          loopActive={autopilotLoopActive}
          loopProgress={autopilotLoopProgress}
          backgroundWatchActive={autopilotBackgroundWatchActive}
          backgroundProgress={autopilotBackgroundProgress}
          goalDriveActive={goalDriveActive}
          onRunNext={onRunAutopilotNext}
          onStartLoop={onStartAutopilotLoop}
          onPauseLoop={onPauseAutopilotLoop}
          onStartBackground={onStartBackgroundWatch}
          onPauseBackground={onPauseBackgroundWatch}
          onPauseGoalDrive={onPauseGoalDrive}
          taskPreview={autopilotTaskPreview}
        />
      ) : null}
      {autopilotQuota ? (
        <AutopilotQuotaBar
          quota={autopilotQuota}
          quotaBlocked={autopilotQuotaBlocked}
          onUpgrade={currentUser ? () => setShowSubscriptionModal(true) : undefined}
          compact
        />
      ) : null}
      {onSaveProof ? (
        <button
          type="button"
          className="intent-shell-bar__action"
          data-testid="intent-shell-save-proof"
          onClick={onSaveProof}
        >
          <FileCheck2 size={12} />
          {t('intent.shell.saveProof')}
        </button>
      ) : null}
      {!narrowLayout && !graphRailOpen && onReopenGraph ? (
        <button type="button" className="intent-shell-bar__action" onClick={onReopenGraph}>
          {t('intent.shell.reopenGraph')}
        </button>
      ) : null}
      {!narrowLayout && !queueRailOpen && onReopenQueue ? (
        <button type="button" className="intent-shell-bar__action" onClick={onReopenQueue}>
          {t('intent.shell.reopenQueue')}
        </button>
      ) : null}
      <button type="button" className="intent-shell-bar__toggle" onClick={onToggleShell}>
        {t('intent.shell.hide')}
      </button>
    </div>
  )
})
