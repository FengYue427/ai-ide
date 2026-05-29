import { memo, useState } from 'react'
import { useI18n } from '../i18n'

const DEFAULT_VISIBLE = 5

interface QueuePreviewListProps {
  kind: 'plan' | 'spec'
  labels: string[]
}

function truncate(text: string, max = 48): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

export const QueuePreviewList = memo(function QueuePreviewList({ kind, labels }: QueuePreviewListProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  if (labels.length === 0) return null

  const visible = expanded ? labels : labels.slice(0, DEFAULT_VISIBLE)
  const hiddenCount = Math.max(0, labels.length - DEFAULT_VISIBLE)
  const prefix = kind === 'plan' ? t('queue.preview.planTag') : t('queue.preview.specTag')

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{t('queue.preview.title')}</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {visible.map((label, index) => (
          <li key={`${kind}-${index}-${label.slice(0, 12)}`}>
            [{prefix}] {truncate(label)}
          </li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '2px 8px', fontSize: 11, marginTop: 4 }}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t('queue.preview.collapse') : t('queue.preview.expand', { count: hiddenCount })}
        </button>
      ) : null}
    </div>
  )
})
