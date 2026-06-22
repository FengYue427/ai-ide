import { Crown } from 'lucide-react'
import { useI18n, type TranslationKey } from '../i18n'

const PLAN_IDS = ['free', 'pro', 'enterprise'] as const
const FEATURE_KEYS = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'] as const

export function WelcomePlanComparison() {
  const { t } = useI18n()

  return (
    <div className="welcome-plan-comparison" data-testid="welcome-plan-comparison">
      <div className="welcome-section-label">
        <Crown size={16} color="var(--accent-color)" />
        <span>{t('welcome.planComparison.title')}</span>
      </div>
      <div className="welcome-plan-comparison__grid">
        {PLAN_IDS.map((planId) => (
          <article
            key={planId}
            className={`welcome-plan-comparison__col welcome-plan-comparison__col--${planId}${planId === 'pro' ? ' welcome-plan-comparison__col--recommended' : ''}${planId === 'enterprise' ? ' welcome-plan-comparison__col--team' : ''}`}
          >
            <div className="welcome-plan-comparison__col-head">
              <h3>{t(`subscription.plan.${planId}.name` as TranslationKey)}</h3>
              {planId === 'pro' ? (
                <span className="welcome-plan-comparison__badge welcome-plan-comparison__badge--recommended">
                  {t('welcome.planComparison.recommended')}
                </span>
              ) : null}
              {planId === 'enterprise' ? (
                <span className="welcome-plan-comparison__badge welcome-plan-comparison__badge--team">
                  {t('welcome.planComparison.team')}
                </span>
              ) : null}
            </div>
            <p className="welcome-plan-comparison__desc">
              {t(`subscription.plan.${planId}.desc` as TranslationKey)}
            </p>
            <ul>
              {FEATURE_KEYS.map((featureKey) => (
                <li key={featureKey}>
                  {t(`subscription.plan.${planId}.${featureKey}` as TranslationKey)}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="welcome-plan-comparison__footnote">{t('welcome.planComparison.footnote')}</p>
    </div>
  )
}
