import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Info, Inbox } from 'lucide-react'

export type InlineStateTone = 'empty' | 'error' | 'hint'

interface InlineStateAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface InlineStatePanelProps {
  tone?: InlineStateTone
  icon?: LucideIcon
  title: string
  description?: string
  primaryAction?: InlineStateAction
  secondaryAction?: InlineStateAction
  tips?: string[]
  compact?: boolean
  className?: string
}

const toneIcon: Record<InlineStateTone, LucideIcon> = {
  empty: Inbox,
  error: AlertTriangle,
  hint: Info,
}

const toneAccent: Record<InlineStateTone, string> = {
  empty: 'var(--accent-color)',
  error: 'var(--danger-color)',
  hint: 'var(--warning-color)',
}

export function InlineStatePanel({
  tone = 'empty',
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  tips = [],
  compact = false,
  className = '',
}: InlineStatePanelProps) {
  const Icon = icon ?? toneIcon[tone]
  const accent = toneAccent[tone]

  return (
    <div
      className={`inline-state-panel inline-state-panel--${tone}${compact ? ' inline-state-panel--compact' : ''} ${className}`.trim()}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <div
        className="inline-state-panel__icon"
        style={{
          background: `color-mix(in srgb, ${accent} 14%, transparent)`,
          color: accent,
        }}
      >
        <Icon size={compact ? 22 : 28} />
      </div>
      <div className="inline-state-panel__body">
        <div className="inline-state-panel__title">{title}</div>
        {description ? <div className="inline-state-panel__desc">{description}</div> : null}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="inline-state-panel__actions">
          {primaryAction && (
            <button
              type="button"
              className={`btn ${primaryAction.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              className={`btn ${secondaryAction.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
      {tips.length > 0 && (
        <ul className="inline-state-panel__tips">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
