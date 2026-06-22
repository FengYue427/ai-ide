import { memo } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useI18n } from '../../i18n'
import { formatGroundingBlockReason } from '../../services/intentOs/groundingBlockMessageService'
import type { LastGroundingBlock } from '../../store/ideStore'

interface IntentGroundingBannerProps {
  block: LastGroundingBlock
  onDismiss?: () => void
  variant?: 'panel' | 'inline'
  testId?: string
}

export const IntentGroundingBanner = memo(function IntentGroundingBanner({
  block,
  onDismiss,
  variant = 'panel',
  testId = 'grounding-block-banner',
}: IntentGroundingBannerProps) {
  const { t } = useI18n()
  const className =
    variant === 'inline' ? 'intent-grounding-inline' : 'intent-grounding-banner'

  return (
    <div className={className} data-testid={testId}>
      <div className="intent-grounding-banner__title">
        <ShieldAlert size={12} />
        {t('intent.grounding.title')}
      </div>
      <div className="intent-grounding-banner__reason">{formatGroundingBlockReason(block, t)}</div>
      {onDismiss ? (
        <button
          type="button"
          className="btn btn-secondary intent-grounding-banner__dismiss"
          data-testid="grounding-block-dismiss"
          onClick={onDismiss}
        >
          {t('intent.grounding.dismiss')}
        </button>
      ) : null}
    </div>
  )
})
