import { memo } from 'react'
import { GraduationCap, X } from 'lucide-react'
import { useI18n } from '../i18n'
import type { CapstoneFunnelStep } from '../lib/capstoneFunnel'

interface CapstoneFunnelHintProps {
  step: CapstoneFunnelStep
  specSlug: string
  onPrimaryAction: () => void
  onDismiss: () => void
}

export const CapstoneFunnelHint = memo(function CapstoneFunnelHint({
  step,
  specSlug,
  onPrimaryAction,
  onDismiss,
}: CapstoneFunnelHintProps) {
  const { t } = useI18n()
  const messageKey =
    step === 'run-tasks'
      ? 'capstone.funnel.runTasks'
      : step === 'check-acceptance'
        ? 'capstone.funnel.checkAcceptance'
        : 'capstone.funnel.reviewSpec'
  const actionKey =
    step === 'run-tasks'
      ? 'capstone.funnel.actionRun'
      : step === 'check-acceptance'
        ? 'capstone.funnel.actionAcceptance'
        : 'capstone.funnel.actionReview'

  return (
    <div className="capstone-funnel-hint" data-testid={`capstone-funnel-${step}`}>
      <GraduationCap size={14} aria-hidden />
      <span>{t(messageKey, { slug: specSlug })}</span>
      <button type="button" className="btn btn-primary btn-sm" onClick={onPrimaryAction}>
        {t(actionKey)}
      </button>
      <button
        type="button"
        className="panel-close-btn capstone-funnel-hint__dismiss"
        aria-label={t('common.close')}
        onClick={onDismiss}
      >
        <X size={14} />
      </button>
    </div>
  )
})
