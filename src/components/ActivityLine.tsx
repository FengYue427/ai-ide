import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Activity } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  exposeRuntimeEventBusForE2E,
  getRecentRuntimeEvents,
  subscribeRuntimeEvents,
  type RuntimeEvent,
} from '../services/runtime/runtimeEventBus'

const MAX_VISIBLE = 12

function formatEventLine(event: RuntimeEvent): string {
  return `${event.type} · ${event.message}`
}

export function ActivityLine() {
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(true)
  const [events, setEvents] = useState<RuntimeEvent[]>(() => getRecentRuntimeEvents(MAX_VISIBLE))

  useEffect(() => {
    exposeRuntimeEventBusForE2E()
    setEvents(getRecentRuntimeEvents(MAX_VISIBLE))
    return subscribeRuntimeEvents(() => {
      setEvents(getRecentRuntimeEvents(MAX_VISIBLE))
    })
  }, [])

  return (
    <div
      data-testid="aide-activity-line"
      style={{
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary, rgba(0,0,0,0.15))',
        fontSize: 11,
        lineHeight: 1.5,
      }}
    >
      <button
        type="button"
        data-testid="aide-activity-line-toggle"
        onClick={() => setCollapsed((value) => !value)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        <Activity size={14} color="var(--accent-color)" />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('activityLine.title')}</span>
        <span style={{ marginLeft: 'auto', opacity: 0.8 }}>
          {t('activityLine.eventCount', { count: String(events.length) })}
        </span>
      </button>
      {!collapsed ? (
        <div
          data-testid="aide-activity-line-body"
          style={{
            maxHeight: 120,
            overflow: 'auto',
            padding: '0 10px 8px',
            color: 'var(--text-secondary)',
          }}
        >
          {events.length === 0 ? (
            <div>{t('activityLine.empty')}</div>
          ) : (
            events
              .slice()
              .reverse()
              .map((event) => <div key={`${event.at}-${event.message}`}>{formatEventLine(event)}</div>)
          )}
        </div>
      ) : null}
    </div>
  )
}
