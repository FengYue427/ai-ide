import { useEffect, useMemo, useState } from 'react'
import { readActivityLineCollapsed, writeActivityLineCollapsed } from '../lib/activityLinePrefs'
import { ChevronDown, ChevronRight, Activity, Bot, GitBranch, ShieldAlert, Zap } from 'lucide-react'
import { useI18n, type TranslationKey } from '../i18n'
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
    default:
      return event.message
  }
}

export function ActivityLine() {
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(() => readActivityLineCollapsed(true))
  const [events, setEvents] = useState<RuntimeEvent[]>(() => getRecentRuntimeEvents(MAX_VISIBLE))

  useEffect(() => {
    exposeRuntimeEventBusForE2E()
    setEvents(getRecentRuntimeEvents(MAX_VISIBLE))
    return subscribeRuntimeEvents(() => {
      setEvents(getRecentRuntimeEvents(MAX_VISIBLE))
    })
  }, [])

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<RuntimeEventType, number>> = {}
    for (const event of events) {
      counts[event.type] = (counts[event.type] ?? 0) + 1
    }
    return counts
  }, [events])

  return (
    <div data-testid="aide-activity-line" className="aide-activity-line">
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
        <span className="aide-activity-line__counts">
          {Object.entries(typeCounts)
            .map(([type, count]) => `${type.split('.')[0]}:${count}`)
            .join(' · ')}
        </span>
        <span className="aide-activity-line__hint">
          {collapsed ? t('activityLine.expandHint') : t('activityLine.eventCount', { count: String(events.length) })}
        </span>
      </button>
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
