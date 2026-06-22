import { memo } from 'react'
import { CheckSquare } from 'lucide-react'
import { useI18n } from '../i18n'

interface IntentDemoVerifyBannerProps {
  onMarkLevelComplete: () => void
  disabled?: boolean
}

export const IntentDemoVerifyBanner = memo(function IntentDemoVerifyBanner({
  onMarkLevelComplete,
  disabled = false,
}: IntentDemoVerifyBannerProps) {
  const { t } = useI18n()
  return (
    <div className="intent-demo-verify-banner" data-testid="intent-demo-verify-banner">
      <div className="intent-demo-verify-banner__text">
        <strong>{t('intent.demo.verifyBanner.title')}</strong>
        <span>{t('intent.demo.verifyBanner.desc')}</span>
      </div>
      <button
        type="button"
        className="btn btn-primary intent-demo-verify-banner__btn"
        disabled={disabled}
        data-testid="intent-demo-mark-complete"
        onClick={onMarkLevelComplete}
      >
        <CheckSquare size={14} />
        {t('intent.demo.verifyBanner.action')}
      </button>
    </div>
  )
})
