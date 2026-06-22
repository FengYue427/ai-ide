import { memo } from 'react'
import { ListOrdered, X } from 'lucide-react'
import { TaskQueuePanel } from './TaskQueuePanel'
import { UpgradeEntitlementHint } from './UpgradeEntitlementHint'
import { useI18n } from '../i18n'
import type { TaskQueuePanelProps } from './TaskQueuePanel'

interface IntentShellQueueRailProps {
  panelProps: TaskQueuePanelProps
  replayAvailable: boolean
  replayLocked?: boolean
  onRestoreFromProof?: () => void
  onUpgrade?: () => void
  onOpenChat: () => void
  drawerOpen?: boolean
  onClose?: () => void
}

export const IntentShellQueueRail = memo(function IntentShellQueueRail({
  panelProps,
  replayAvailable,
  replayLocked = false,
  onRestoreFromProof,
  onUpgrade,
  onOpenChat,
  drawerOpen = false,
  onClose,
}: IntentShellQueueRailProps) {
  const { t } = useI18n()

  return (
    <aside
      className={[
        'intent-shell-queue',
        drawerOpen ? 'intent-shell-queue--drawer-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="intent-shell-queue"
    >
      <header className="intent-shell-queue__header">
        <ListOrdered size={14} />
        <span>{t('intent.shell.queueTitle')}</span>
        <button type="button" className="btn btn-secondary intent-shell-queue__chat" onClick={onOpenChat}>
          {t('intent.shell.openChat')}
        </button>
        {onClose ? (
          <button
            type="button"
            className="panel-close-btn intent-shell-rail__close"
            onClick={onClose}
            aria-label={t('panel.close')}
          >
            <X size={14} />
          </button>
        ) : null}
      </header>
      <div className="intent-shell-queue__body">
        {replayAvailable && onRestoreFromProof && !replayLocked ? (
          <button
            type="button"
            className="btn btn-secondary intent-shell-queue__replay"
            data-testid="intent-shell-restore-proof"
            onClick={onRestoreFromProof}
          >
            {t('intent.replay.restoreProof')}
          </button>
        ) : null}
        {replayAvailable && replayLocked ? (
          <div className="intent-shell-queue__replay-locked" data-testid="intent-shell-replay-locked">
            <button type="button" className="btn btn-secondary intent-shell-queue__replay" disabled>
              {t('intent.replay.restoreProof')}
            </button>
            <UpgradeEntitlementHint
              messageKey="entitlements.upgrade.intentLinkage"
              onUpgrade={onUpgrade}
              compact
            />
          </div>
        ) : null}
        <TaskQueuePanel {...panelProps} />
      </div>
    </aside>
  )
})
