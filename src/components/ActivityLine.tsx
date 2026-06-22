import { useEffect, useMemo, useState } from 'react'
import { readActivityLineCollapsed, writeActivityLineCollapsed } from '../lib/activityLinePrefs'
import { ChevronDown, ChevronRight, Activity, Bot, GitBranch, ShieldAlert, Zap, Crown } from 'lucide-react'
import { useI18n, type TranslationKey } from '../i18n'
import { buildWorkspaceRhythm, type WorkspaceRhythmStage } from '../lib/workspaceRhythm'
import { subscribeAideLink, type AideLinkEvent } from '../lib/aideLinkBus'
import { resolveAideLinkFeatureLabel } from '../lib/aideLinkFeatureLabels'
import { trackUpgradeClick } from '../lib/conversionTracking'
import { useIDEStore } from '../store/ideStore'
import {
  exposeRuntimeEventBusForE2E,
  getRecentRuntimeEvents,
  subscribeRuntimeEvents,
  type RuntimeEvent,
  type RuntimeEventType,
} from '../services/runtime/runtimeEventBus'

const MAX_VISIBLE = 16

function eventIcon(type: RuntimeEventType) {
  switch (type) {
    case 'queue.progress':
      return <GitBranch size={12} />
    case 'agent.fileWrite':
      return <Bot size={12} />
    case 'hook.start':
    case 'hook.end':
      return <Zap size={12} />
    case 'verify.fail':
      return <ShieldAlert size={12} color="var(--danger-color, #c44)" />
    case 'grounding.block':
      return <ShieldAlert size={12} color="var(--warning-color, #c90)" />
    default:
      return <Activity size={12} />
  }
}

function formatEventTime(at: string): string {
  const date = new Date(at)
  if (Number.isNaN(date.getTime())) return at
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function eventLabel(
  event: RuntimeEvent,
  t: (key: TranslationKey, params?: Record<string, string>) => string,
): string {
  const spec = typeof event.meta?.spec === 'string' ? event.meta.spec : null
  const prefix = spec ? `[${spec}] ` : ''
  switch (event.type) {
    case 'queue.progress':
      return `${prefix}${event.message}`
    case 'agent.fileWrite':
      return `${t('activityLine.agentWrite')} · ${event.message}`
    case 'hook.start':
      return `${t('activityLine.hookStart')} · ${event.message}`
    case 'hook.end': {
      const ok = event.meta?.ok === true
      return `${t('activityLine.hookEnd')} · ${event.message} · ${ok ? t('activityLine.ok') : t('activityLine.fail')}`
    }
    case 'verify.fail':
      return `${t('activityLine.verifyFail')} · ${event.message}`
    case 'grounding.block':
      return `${t('activityLine.groundingBlock')} · ${event.message}`
    default:
      return event.message
  }
}

function aideLinkHintLabel(
  event: AideLinkEvent,
  t: (key: TranslationKey, params?: Record<string, string>) => string,
): string {
  const featureRaw = typeof event.payload?.feature === 'string' ? event.payload.feature : ''
  const feature = featureRaw ? resolveAideLinkFeatureLabel(featureRaw, t) : ''
  if (event.type === 'quota-exceeded') {
    if (event.payload?.blocked === 'true') {
      return t('activityLine.quotaBlocked')
    }
    return feature ? t('activityLine.quotaExceeded', { feature }) : t('activityLine.quotaBlocked')
  }
  if (event.type === 'entitlement-blocked') {
    return feature
      ? t('activityLine.entitlementBlocked', { feature })
      : t('activityLine.entitlementBlockedGeneric')
  }
  return ''
}

export function ActivityLine() {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const workspaceMode = useIDEStore((s) => s.workspaceMode)
  const failedSpecExecution = useIDEStore((s) => s.failedSpecExecution)
  const verifyingSpecBackfill = useIDEStore((s) => s.verifyingSpecBackfill)
  const queuedSpecBackfill = useIDEStore((s) => s.queuedSpecBackfill)
  const currentUser = useIDEStore((s) => s.currentUser)
  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)
  const [collapsed, setCollapsed] = useState(() => readActivityLineCollapsed(true))
  const [events, setEvents] = useState<RuntimeEvent[]>(() => getRecentRuntimeEvents(MAX_VISIBLE))
  const [linkHint, setLinkHint] = useState<AideLinkEvent | null>(null)

  const rhythm = useMemo(
    () =>
      buildWorkspaceRhythm(files, {
        failedSpecExecution: Boolean(failedSpecExecution),
        verifyingSpecBackfill: Boolean(verifyingSpecBackfill),
        queuedSpecBackfill: Boolean(queuedSpecBackfill),
        workspaceMode,
      }),
    [failedSpecExecution, files, queuedSpecBackfill, verifyingSpecBackfill, workspaceMode],
  )

  const rhythmLabelKey: Record<WorkspaceRhythmStage, TranslationKey> = {
    idle: 'activityLine.rhythm.idle',
    planning: 'activityLine.rhythm.planning',
    executing: 'activityLine.rhythm.executing',
    verify: 'activityLine.rhythm.verify',
    failed: 'activityLine.rhythm.failed',
    review: 'activityLine.rhythm.review',
  }

  useEffect(() => {
    exposeRuntimeEventBusForE2E()
    setEvents(getRecentRuntimeEvents(MAX_VISIBLE))
    return subscribeRuntimeEvents(() => {
      setEvents(getRecentRuntimeEvents(MAX_VISIBLE))
    })
  }, [])

  useEffect(() => {
    return subscribeAideLink((event) => {
      if (event.type === 'quota-exceeded' || event.type === 'entitlement-blocked') {
        setLinkHint(event)
      }
    })
  }, [])

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<RuntimeEventType, number>> = {}
    for (const event of events) {
      counts[event.type] = (counts[event.type] ?? 0) + 1
    }
    return counts
  }, [events])

  const linkHintLabel = linkHint ? aideLinkHintLabel(linkHint, t) : ''

  return (
    <div data-testid="aide-activity-line" className="aide-activity-line">
      <div className="aide-activity-line__bar">
        <button
          type="button"
          data-testid="aide-activity-line-toggle"
          className="aide-activity-line__toggle"
          onClick={() => {
            setCollapsed((value) => {
              const next = !value
              writeActivityLineCollapsed(next)
              return next
            })
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <Activity size={14} color="var(--accent-color)" />
          <span className="aide-activity-line__title">{t('activityLine.title')}</span>
          <span
            className={`aide-activity-line__rhythm aide-activity-line__rhythm--${rhythm.stage}`}
            data-testid="aide-activity-rhythm"
          >
            {t(rhythmLabelKey[rhythm.stage])}
            {rhythm.openTaskCount > 0 ? ` · ${rhythm.openTaskCount}` : ''}
          </span>
          <span className="aide-activity-line__counts">
            {Object.entries(typeCounts)
              .map(([type, count]) => `${type.split('.')[0]}:${count}`)
              .join(' · ')}
          </span>
          <span className="aide-activity-line__hint">
            {collapsed ? t('activityLine.expandHint') : t('activityLine.eventCount', { count: String(events.length) })}
          </span>
        </button>
        {linkHint && linkHintLabel ? (
          <div className="aide-activity-line__link-hint-wrap" data-testid="aide-activity-link-hint">
            <span className="aide-activity-line__link-hint">
              <Crown size={12} />
              {linkHintLabel}
            </span>
            {currentUser ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm aide-activity-line__upgrade"
                data-testid="aide-activity-link-upgrade"
                onClick={() => {
                  trackUpgradeClick('activity-line')
                  setShowSubscriptionModal(true)
                }}
              >
                {t('entitlements.card.upgrade')}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {!collapsed ? (
        <div data-testid="aide-activity-line-body" className="aide-activity-line__body">
          {events.length === 0 ? (
            <div>{t('activityLine.empty')}</div>
          ) : (
            events
              .slice()
              .reverse()
              .map((event) => (
                <div
                  key={`${event.at}-${event.type}-${event.message}`}
                  data-testid={`aide-activity-event-${event.type}`}
                  className="aide-activity-line__row"
                >
                  <span className="aide-activity-line__icon">{eventIcon(event.type)}</span>
                  <span className="aide-activity-line__message">{eventLabel(event, t)}</span>
                  <span className="aide-activity-line__time">{formatEventTime(event.at)}</span>
                </div>
              ))
          )}
        </div>
      ) : null}
    </div>
  )
}
