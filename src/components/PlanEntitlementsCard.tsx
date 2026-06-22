import { useMemo } from 'react'
import { Check, Crown, X } from 'lucide-react'
import {
  ENTITLEMENT_HIGHLIGHT_IDS,
  getEntitlements,
  type EntitlementHighlightId,
  type PlanEntitlements,
} from '../../lib/billing/entitlements'
import { getClientEntitlements } from '../lib/clientPlanEntitlements'
import { useI18n, type TranslationKey } from '../i18n'

interface PlanEntitlementsCardProps {
  planName: string
  onUpgrade?: () => void
}

function formatUnlimited(value: number, unlimitedLabel: string): string {
  return value < 0 ? unlimitedLabel : String(value)
}

function highlightEnabled(id: EntitlementHighlightId, entitlements: PlanEntitlements): boolean {
  switch (id) {
    case 'aiQuota':
      return entitlements.aiRequestsPerDay > 200
    case 'workspaces':
      return entitlements.workspaces !== 3
    case 'storage':
      return entitlements.storageGB > 5
    case 'autopilot':
      return entitlements.features.autopilotUnlimited
    case 'backgroundJobs':
      return entitlements.backgroundJobsPerDay > 2
    case 'intentLinkage':
      return entitlements.features.intentFullLinkage
    case 'proofExport':
      return entitlements.features.proofHtmlExport
    case 'shares':
      return entitlements.maxShares > 5 || entitlements.shareTtlDays > 7
    case 'collab':
      return entitlements.features.collabHost
    default:
      return false
  }
}

function highlightParams(
  id: EntitlementHighlightId,
  entitlements: PlanEntitlements,
  unlimitedLabel: string,
): Record<string, string | number> {
  switch (id) {
    case 'aiQuota':
      return { quota: formatUnlimited(entitlements.aiRequestsPerDay, unlimitedLabel) }
    case 'workspaces':
      return { count: formatUnlimited(entitlements.workspaces, unlimitedLabel) }
    case 'storage':
      return { gb: entitlements.storageGB }
    case 'autopilot':
      return {
        runs:
          entitlements.autopilotRunsPerDay < 0
            ? unlimitedLabel
            : entitlements.autopilotRunsPerDay,
      }
    case 'backgroundJobs':
      return {
        daily: entitlements.backgroundJobsPerDay,
        concurrent: entitlements.backgroundJobsMaxActive,
      }
    case 'shares':
      return { count: entitlements.maxShares, days: entitlements.shareTtlDays }
    case 'collab':
      return { count: entitlements.collabMaxParticipants }
    default:
      return {}
  }
}

/** Team tier numeric advantages over Pro (for badge display). */
function isTeamTierAdvantage(id: EntitlementHighlightId, entitlements: PlanEntitlements): boolean {
  if (entitlements.planName !== 'enterprise') return false
  const pro = getEntitlements('pro')
  switch (id) {
    case 'aiQuota':
      return entitlements.aiRequestsPerDay < 0 && pro.aiRequestsPerDay > 0
    case 'workspaces':
      return entitlements.workspaces < 0
    case 'storage':
      return entitlements.storageGB > pro.storageGB
    case 'backgroundJobs':
      return (
        entitlements.backgroundJobsPerDay > pro.backgroundJobsPerDay ||
        entitlements.backgroundJobsMaxActive > pro.backgroundJobsMaxActive
      )
    case 'shares':
      return entitlements.maxShares > pro.maxShares || entitlements.shareTtlDays > pro.shareTtlDays
    case 'collab':
      return entitlements.collabMaxParticipants > pro.collabMaxParticipants
    default:
      return false
  }
}

export function PlanEntitlementsCard({ planName, onUpgrade }: PlanEntitlementsCardProps) {
  const { t } = useI18n()
  const entitlements = useMemo(() => getClientEntitlements(planName), [planName])
  const unlimitedLabel = t('subscription.unlimited')
  const planLabel = t(`subscription.plan.${entitlements.planName}.name` as TranslationKey)
  const isTeam = entitlements.planName === 'enterprise'

  return (
    <div
      className={`settings-card plan-entitlements-card${isTeam ? ' plan-entitlements-card--team' : ''}`}
      data-testid="plan-entitlements-card"
    >
      <div className="plan-entitlements-card__head">
        <Crown size={18} />
        <div>
          <strong>{t('entitlements.card.title')}</strong>
          <p className="settings-privacy-text">{t('entitlements.card.planIs', { plan: planLabel })}</p>
        </div>
      </div>

      {isTeam ? (
        <p className="plan-entitlements-card__team-lead" data-testid="plan-entitlements-team-lead">
          {t('entitlements.card.teamPerksLead')}
        </p>
      ) : null}

      <ul className="plan-entitlements-card__list">
        {ENTITLEMENT_HIGHLIGHT_IDS.map((id) => {
          const enabled = highlightEnabled(id, entitlements)
          const teamPlus = isTeamTierAdvantage(id, entitlements)
          const labelKey = `entitlements.highlight.${id}` as TranslationKey
          return (
            <li
              key={id}
              className={`plan-entitlements-card__item${enabled ? '' : ' plan-entitlements-card__item--muted'}`}
            >
              {enabled ? (
                <Check size={14} className="plan-entitlements-card__icon plan-entitlements-card__icon--ok" />
              ) : (
                <X size={14} className="plan-entitlements-card__icon" />
              )}
              <span className="plan-entitlements-card__label">
                {t(labelKey, highlightParams(id, entitlements, unlimitedLabel))}
              </span>
              {teamPlus ? (
                <span className="plan-entitlements-card__team-badge" data-testid={`plan-entitlement-team-plus-${id}`}>
                  {t('entitlements.card.teamPlus')}
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>

      {entitlements.planName === 'free' && onUpgrade ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={onUpgrade}>
          {t('entitlements.card.upgrade')}
        </button>
      ) : null}

      {entitlements.planName === 'pro' && onUpgrade ? (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onUpgrade}>
          {t('entitlements.card.upgradeTeam')}
        </button>
      ) : null}
    </div>
  )
}
