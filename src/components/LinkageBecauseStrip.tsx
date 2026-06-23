import { memo } from 'react'
import { Link2 } from 'lucide-react'
import { useI18n } from '../i18n'
import { linkageReasonLabelKey, parseLinkageReasons } from '../lib/linkageReason'

interface LinkageBecauseStripProps {
  becauseRaw?: string
  compact?: boolean
}

export const LinkageBecauseStrip = memo(function LinkageBecauseStrip({
  becauseRaw,
  compact = false,
}: LinkageBecauseStripProps) {
  const { t } = useI18n()
  const reasons = parseLinkageReasons(becauseRaw)
  if (reasons.length === 0) return null

  const labels = reasons.slice(0, compact ? 3 : 6).map((reason) => {
    const key = linkageReasonLabelKey(reason.id)
    return reason.detail ? t(key, { detail: reason.detail }) : t(key)
  })

  return (
    <div className="linkage-because-strip" data-testid="linkage-because-strip">
      <Link2 size={12} />
      <span>{t('linkage.because.prefix')}</span>
      <span className="linkage-because-strip__chain">{labels.join(' · ')}</span>
    </div>
  )
})
