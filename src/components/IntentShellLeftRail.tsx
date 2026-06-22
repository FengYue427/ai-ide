import { memo } from 'react'
import { GitBranch, X } from 'lucide-react'
import { IntentGraphPanel } from './IntentGraphPanel'
import { useI18n } from '../i18n'

interface IntentShellLeftRailProps {
  focusTasksPath?: string | null
  highlightTaskText?: string | null
  onOpenPath: (path: string) => void
  drawerOpen?: boolean
  onClose?: () => void
}

export const IntentShellLeftRail = memo(function IntentShellLeftRail({
  focusTasksPath,
  highlightTaskText,
  onOpenPath,
  drawerOpen = false,
  onClose,
}: IntentShellLeftRailProps) {
  const { t } = useI18n()

  return (
    <aside
      className={[
        'intent-shell-left',
        drawerOpen ? 'intent-shell-left--drawer-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="intent-shell-left"
    >
      <header className="intent-shell-left__header">
        <GitBranch size={14} />
        <span>{t('intent.shell.graphTitle')}</span>
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
      <div className="intent-shell-left__body">
        <IntentGraphPanel
          variant="shell"
          focusTasksPath={focusTasksPath}
          highlightTaskText={highlightTaskText}
          onOpenPath={onOpenPath}
        />
      </div>
    </aside>
  )
})
