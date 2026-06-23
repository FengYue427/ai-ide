import { useEffect, useMemo, useState } from 'react'
import { readActivityLineCollapsed, writeActivityLineCollapsed } from '../lib/activityLinePrefs'
import { ChevronDown, ChevronRight, Activity, Bot, GitBranch, ShieldAlert, Zap, Crown, Sparkles, Target, Link2 } from 'lucide-react'
import { useI18n, type TranslationKey } from '../i18n'
import { buildWorkspaceRhythm, type WorkspaceRhythmStage } from '../lib/workspaceRhythm'
import { stopAutopilotLoopState } from '../lib/autopilotLoop'
import { stopAutopilotBackgroundWatchState } from '../lib/autopilotBackgroundWatch'
import { publishAutopilotLoopEvent, publishAutopilotBackgroundEvent } from '../services/runtime/runtimeActivityPublishers'
import { subscribeAideLink, type AideLinkEvent } from '../lib/aideLinkBus'
import { linkageAideLinkActivityLabel } from '../lib/linkageLinkEvents'
import { resolveAideLinkFeatureLabel } from '../lib/aideLinkFeatureLabels'
import { trackUpgradeClick } from '../lib/conversionTracking'
import { LinkageBecauseStrip } from './LinkageBecauseStrip'
import { useIDEStore } from '../store/ideStore'
import {
  exposeRuntimeEventBusForE2E,
  getRecentRuntimeEvents,
  subscribeRuntimeEvents,
  type RuntimeEvent,
  type RuntimeEventType,
} from '../services/runtime/runtimeEventBus'

const MAX_VISIBLE = 16
const MAX_LINKAGE_FEED = 8

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
    case 'autopilot.loop':
      return <Sparkles size={12} color="var(--accent-color)" />
    case 'autopilot.background':
      return <Bot size={12} color="var(--accent-color)" />
    case 'autopilot.goal':
      return <Target size={12} color="var(--accent-color)" />
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
    case 'autopilot.loop':
      return event.message.startsWith('start:')
        ? t('activityLine.autopilotLoopStart', {
            path: String(event.meta?.tasksPath ?? event.message.replace(/^start:\s*/, '')),
          })
        : event.message.startsWith('stop:')
          ? t('activityLine.autopilotLoopStop', { detail: event.message.replace(/^stop:\s*/, '') })
          : t('activityLine.autopilotLoopStep', { detail: event.message.replace(/^step:\s*/, '') })
    case 'autopilot.background':
      return event.message.startsWith('start:')
        ? t('activityLine.autopilotBackgroundStart', {
            path: String(event.meta?.tasksPath ?? event.message.replace(/^start:\s*/, '')),
          })
        : event.message.startsWith('stop:')
          ? t('activityLine.autopilotBackgroundStop', { detail: event.message.replace(/^stop:\s*/, '') })
          : t('activityLine.autopilotBackgroundStep', { detail: event.message.replace(/^step:\s*/, '') })
    case 'autopilot.goal':
      return event.message.startsWith('start:')
        ? t('activityLine.autopilotGoalStart', { detail: event.message.replace(/^start:\s*/, '').slice(0, 80) })
        : t('activityLine.autopilotGoalStop', { detail: event.message.replace(/^stop:\s*/, '') })
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
  const linkageLabel = linkageAideLinkActivityLabel(event, t)
  if (linkageLabel) return linkageLabel
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
  const autopilotLoop = useIDEStore((s) => s.autopilotLoop)
  const setAutopilotLoop = useIDEStore((s) => s.setAutopilotLoop)
  const autopilotBackgroundWatch = useIDEStore((s) => s.autopilotBackgroundWatch)
  const setAutopilotBackgroundWatch = useIDEStore((s) => s.setAutopilotBackgroundWatch)
  const [collapsed, setCollapsed] = useState(() => readActivityLineCollapsed(true))
  const [events, setEvents] = useState<RuntimeEvent[]>(() => getRecentRuntimeEvents(MAX_VISIBLE))
  const [linkHint, setLinkHint] = useState<AideLinkEvent | null>(null)
  const [linkageFeed, setLinkageFeed] = useState<AideLinkEvent[]>([])

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
      if (event.type === 'linkage-autopilot' || event.type === 'linkage-graph-changed') {
        setLinkageFeed((prev) => [event, ...prev].slice(0, MAX_LINKAGE_FEED))
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
  const latestLinkage = linkageFeed[0]
  const latestLinkageLabel = latestLinkage ? linkageAideLinkActivityLabel(latestLinkage, t) : ''

  const latestBecause = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i]
      if (
        event.type !== 'autopilot.loop' &&
        event.type !== 'autopilot.background' &&
        event.type !== 'autopilot.goal'
      ) {
        continue
      }
      const because = event.meta?.because
      if (typeof because === 'string' && because.trim()) return because
    }
    return undefined
  }, [events])

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
        {latestBecause ? <LinkageBecauseStrip becauseRaw={latestBecause} compact /> : null}
        {autopilotLoop?.active ? (
          <div className="aide-activity-line__loop" data-testid="aide-activity-autopilot-loop">
            <Sparkles size={12} />
            <span>
              {t('activityLine.autopilotLoopActive', {
                completed: autopilotLoop.stepsCompleted,
                total: Math.max(autopilotLoop.openAtStart, autopilotLoop.stepsCompleted + 1),
              })}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              data-testid="aide-activity-autopilot-pause"
              onClick={() => {
                if (!autopilotLoop) return
                stopAutopilotLoopState(autopilotLoop, 'paused')
                publishAutopilotLoopEvent('stop', 'paused', {
                  stepsCompleted: autopilotLoop.stepsCompleted,
                })
                setAutopilotLoop(null)
              }}
            >
              {t('intent.autopilot.loopPauseShort')}
            </button>
          </div>
        ) : null}
        {autopilotBackgroundWatch?.active ? (
          <div className="aide-activity-line__loop" data-testid="aide-activity-autopilot-background">
            <Bot size={12} />
            <span>
              {t('activityLine.autopilotBackgroundActive', {
                queued: autopilotBackgroundWatch.stepsQueued,
              })}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              data-testid="aide-activity-autopilot-background-pause"
              onClick={() => {
                if (!autopilotBackgroundWatch) return
                stopAutopilotBackgroundWatchState(autopilotBackgroundWatch, 'paused')
                publishAutopilotBackgroundEvent('stop', 'paused', {
                  tasksPath: autopilotBackgroundWatch.tasksPath,
                  stepsQueued: autopilotBackgroundWatch.stepsQueued,
                })
                setAutopilotBackgroundWatch(null)
              }}
            >
              {t('intent.autopilot.backgroundPauseShort')}
            </button>
          </div>
        ) : null}
        {latestLinkageLabel ? (
          <div className="aide-activity-line__linkage" data-testid="aide-activity-linkage-latest">
            <Link2 size={12} />
            <span>{latestLinkageLabel}</span>
          </div>
        ) : null}
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
          {linkageFeed.length > 0 ? (
            <div className="aide-activity-line__linkage-feed" data-testid="aide-activity-linkage-feed">
              {linkageFeed.map((event) => (
                <div
                  key={`${event.type}-${event.at}`}
                  className="aide-activity-line__row aide-activity-line__row--linkage"
                  data-testid={`aide-activity-linkage-${event.type}`}
                >
                  <span className="aide-activity-line__icon">
                    <Link2 size={12} />
                  </span>
                  <span className="aide-activity-line__message">{linkageAideLinkActivityLabel(event, t)}</span>
                  <span className="aide-activity-line__time">{formatEventTime(event.at)}</span>
                </div>
              ))}
            </div>
          ) : null}
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
