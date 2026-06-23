import { memo } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'
import { buildSpecStatusSummary } from '../lib/specStatusSummary'
import { useIDEStore } from '../store/ideStore'

interface LinkageAutopilotHintProps {
  gitModifiedCount: number
  onRunAutopilot?: () => void
  onStartBackgroundWatch?: () => void
  backgroundWatchActive?: boolean
  backgroundAgentEnabled?: boolean
}

export const LinkageAutopilotHint = memo(function LinkageAutopilotHint({
  gitModifiedCount,
  onRunAutopilot,
  onStartBackgroundWatch,
  backgroundWatchActive = false,
  backgroundAgentEnabled = false,
}: LinkageAutopilotHintProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const summary = buildSpecStatusSummary(files)

  if (gitModifiedCount > 0 || summary.openTaskCount === 0) return null
  if (!onRunAutopilot && !onStartBackgroundWatch) return null

  return (
    <div className="linkage-autopilot-hint" data-testid="linkage-autopilot-hint">
      <Sparkles size={14} />
      <span>{t('linkage.autopilotHint')}</span>
      {onRunAutopilot && backgroundAgentEnabled && onStartBackgroundWatch && !backgroundWatchActive ? (
        <button
          type="button"
          className="btn btn-secondary"
          data-testid="linkage-background-watch"
          onClick={onStartBackgroundWatch}
        >
          <Bot size={12} />
          {t('linkage.autonomy.executeBackground')}
        </button>
      ) : onRunAutopilot ? (
        <button type="button" className="btn btn-secondary" onClick={onRunAutopilot}>
          {t('linkage.autonomy.manualNext')}
        </button>
      ) : null}
    </div>
  )
})
