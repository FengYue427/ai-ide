import { memo } from 'react'
import { LayoutGrid } from 'lucide-react'
import { useI18n } from '../i18n'
import { WORKSPACE_MODES, type WorkspaceMode } from '../lib/workspaceMode'

interface WorkspaceModeSwitcherProps {
  mode: WorkspaceMode
  onChange: (mode: WorkspaceMode) => void
}

const MODE_LABEL_KEYS: Record<WorkspaceMode, 'workspaceMode.code' | 'workspaceMode.plan' | 'workspaceMode.execute' | 'workspaceMode.review'> = {
  code: 'workspaceMode.code',
  plan: 'workspaceMode.plan',
  execute: 'workspaceMode.execute',
  review: 'workspaceMode.review',
}

export const WorkspaceModeSwitcher = memo(function WorkspaceModeSwitcher({
  mode,
  onChange,
}: WorkspaceModeSwitcherProps) {
  const { t } = useI18n()

  return (
    <div className="workspace-mode-switcher" data-testid="workspace-mode-switcher" title={t('workspaceMode.title')}>
      <LayoutGrid size={14} aria-hidden />
      {WORKSPACE_MODES.map((item) => (
        <button
          key={item}
          type="button"
          className={`workspace-mode-switcher__btn ${mode === item ? 'workspace-mode-switcher__btn--active' : ''}`}
          data-testid={`workspace-mode-${item}`}
          onClick={() => onChange(item)}
        >
          {t(MODE_LABEL_KEYS[item])}
        </button>
      ))}
    </div>
  )
})
