import { memo, useCallback, useState } from 'react'
import { Target } from 'lucide-react'
import { useI18n } from '../i18n'
import { ModalShell } from './ui/ModalShell'

interface GoalDriveAutopilotDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (goal: string) => void
  busy?: boolean
}

export const GoalDriveAutopilotDialog = memo(function GoalDriveAutopilotDialog({
  open,
  onClose,
  onSubmit,
  busy = false,
}: GoalDriveAutopilotDialogProps) {
  const { t } = useI18n()
  const [goal, setGoal] = useState('')

  const handleSubmit = useCallback(() => {
    const trimmed = goal.trim()
    if (!trimmed || busy) return
    onSubmit(trimmed)
    setGoal('')
  }, [busy, goal, onSubmit])

  if (!open) return null

  return (
    <ModalShell
      title={t('intent.autopilot.goalDriveTitle')}
      onClose={onClose}
      ariaLabel={t('intent.autopilot.goalDriveTitle')}
    >
      <p className="settings-hint">{t('intent.autopilot.goalDriveHint')}</p>
      <label className="settings-label" htmlFor="goal-drive-input">
        {t('intent.autopilot.goalDriveLabel')}
      </label>
      <textarea
        id="goal-drive-input"
        className="settings-input goal-drive-input"
        data-testid="goal-drive-input"
        rows={4}
        value={goal}
        placeholder={t('intent.autopilot.goalDrivePlaceholder')}
        onChange={(event) => setGoal(event.target.value)}
      />
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          data-testid="goal-drive-submit"
          disabled={!goal.trim() || busy}
          onClick={handleSubmit}
        >
          <Target size={14} />
          {t('intent.autopilot.goalDriveSubmit')}
        </button>
      </div>
    </ModalShell>
  )
})
