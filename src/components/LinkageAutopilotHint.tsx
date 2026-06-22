import { memo } from 'react'
import { Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'
import { buildSpecStatusSummary } from '../lib/specStatusSummary'
import { useIDEStore } from '../store/ideStore'

interface LinkageAutopilotHintProps {
  gitModifiedCount: number
  onRunAutopilot?: () => void
}

export const LinkageAutopilotHint = memo(function LinkageAutopilotHint({
  gitModifiedCount,
  onRunAutopilot,
}: LinkageAutopilotHintProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const summary = buildSpecStatusSummary(files)

  if (gitModifiedCount > 0 || summary.openTaskCount === 0 || !onRunAutopilot) return null

  return (
    <div className="linkage-autopilot-hint" data-testid="linkage-autopilot-hint">
      <Sparkles size={14} />
      <span>{t('linkage.autopilotHint')}</span>
      <button type="button" className="btn btn-secondary" onClick={onRunAutopilot}>
        {t('intent.autopilot.runNext')}
      </button>
    </div>
  )
})
