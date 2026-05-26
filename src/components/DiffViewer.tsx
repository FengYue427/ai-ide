import React, { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  applyPartialDiff,
  computeLineDiff,
  defaultAcceptedHunks,
  groupDiffHunks,
} from '../services/diffHunkService'

interface DiffViewerProps {
  oldContent: string
  newContent: string
  oldLabel?: string
  newLabel?: string
  onClose: () => void
  embedded?: boolean
  onApply?: () => void
  applyLabel?: string
  enablePartialApply?: boolean
  onApplyPartial?: (mergedContent: string) => void
  partialApplyLabel?: string
  /** Controlled hunk selection (Agent apply modal). */
  acceptedHunks?: Set<number>
  onAcceptedHunksChange?: (next: Set<number>) => void
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldContent,
  newContent,
  oldLabel,
  newLabel,
  onClose,
  embedded = false,
  onApply,
  applyLabel,
  enablePartialApply = false,
  onApplyPartial,
  partialApplyLabel,
  acceptedHunks: acceptedHunksProp,
  onAcceptedHunksChange,
}) => {
  const { t } = useI18n()
  const resolvedOldLabel = oldLabel ?? t('diff.oldLabel')
  const resolvedNewLabel = newLabel ?? t('diff.newLabel')
  const resolvedApplyLabel = applyLabel ?? t('diff.apply')
  const resolvedPartialApplyLabel = partialApplyLabel ?? t('diff.applyPartial')
  const [showUnchanged, setShowUnchanged] = useState(true)

  const diffLines = useMemo(() => computeLineDiff(oldContent, newContent), [oldContent, newContent])
  const hunks = useMemo(() => groupDiffHunks(diffLines), [diffLines])
  const [acceptedHunksInternal, setAcceptedHunksInternal] = useState(() => defaultAcceptedHunks(diffLines))
  const controlled = acceptedHunksProp !== undefined
  const acceptedHunks = controlled ? acceptedHunksProp : acceptedHunksInternal

  const setAcceptedHunks = (next: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    const resolved = typeof next === 'function' ? next(acceptedHunks) : next
    if (controlled) onAcceptedHunksChange?.(resolved)
    else setAcceptedHunksInternal(resolved)
  }

  useEffect(() => {
    if (controlled) return
    setAcceptedHunksInternal(defaultAcceptedHunks(diffLines))
  }, [diffLines, controlled])

  const stats = useMemo(() => {
    const added = diffLines.filter((line) => line.type === 'added').length
    const removed = diffLines.filter((line) => line.type === 'removed').length
    const unchanged = diffLines.filter((line) => line.type === 'unchanged').length
    return { added, removed, unchanged, total: diffLines.length }
  }, [diffLines])

  const visibleLines = showUnchanged ? diffLines : diffLines.filter((line) => line.type !== 'unchanged')

  const getLineStyle = (type: (typeof diffLines)[number]['type']) => {
    switch (type) {
      case 'added':
        return { background: 'rgba(35, 197, 94, 0.15)', borderLeft: '3px solid #23c55e' }
      case 'removed':
        return { background: 'rgba(239, 68, 68, 0.15)', borderLeft: '3px solid #ef4444' }
      default:
        return { background: 'transparent', borderLeft: '3px solid transparent' }
    }
  }

  const toggleHunk = (index: number) => {
    setAcceptedHunks((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const showPartial = enablePartialApply && hunks.length > 0 && !!onApplyPartial

  const panel = (
    <div
      style={{
        background: embedded ? 'transparent' : 'var(--bg-primary)',
        borderRadius: embedded ? 0 : '12px',
        width: '100%',
        maxWidth: embedded ? 'none' : '900px',
        maxHeight: embedded ? '100%' : '90vh',
        height: embedded ? '100%' : undefined,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{t('diff.title')}</h3>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
          <span style={{ color: '#23c55e' }}>{t('diff.added', { count: stats.added })}</span>
          <span style={{ color: '#ef4444' }}>{t('diff.removed', { count: stats.removed })}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{t('diff.unchanged', { count: stats.unchanged })}</span>
        </div>
        <div style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showUnchanged} onChange={(event) => setShowUnchanged(event.target.checked)} />
          {t('diff.showUnchanged')}
        </label>
        {!embedded ? (
          <button onClick={onClose} style={{ padding: '4px' }} type="button">
            <X size={20} />
          </button>
        ) : null}
      </div>

      {showPartial ? (
        <div
          className="diff-hunk-picker"
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            fontSize: '12px',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>
            {t('diff.hunks', { accepted: acceptedHunks.size, total: hunks.length })}
          </span>
          {hunks.map((hunk, index) => {
            const added = hunk.filter((line) => line.type === 'added').length
            const removed = hunk.filter((line) => line.type === 'removed').length
            return (
              <label
                key={index}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: acceptedHunks.has(index)
                    ? 'color-mix(in srgb, var(--accent-color) 10%, transparent)'
                    : 'var(--bg-secondary)',
                  cursor: 'pointer',
                }}
              >
                <input type="checkbox" checked={acceptedHunks.has(index)} onChange={() => toggleHunk(index)} />
                {t('diff.hunk', { index: index + 1, added, removed })}
              </label>
            )
          })}
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => setAcceptedHunks(defaultAcceptedHunks(diffLines))}
          >
            {t('diff.selectAll')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => setAcceptedHunks(new Set())}
          >
            {t('diff.selectNone')}
          </button>
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 60px 1fr',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          padding: '8px 0',
        }}
      >
        <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>{resolvedOldLabel}</div>
        <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>{resolvedNewLabel}</div>
        <div style={{ paddingLeft: '12px' }}>{t('diff.content')}</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}>
        {visibleLines.map((line, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 60px 1fr',
              ...getLineStyle(line.type),
            }}
          >
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)', padding: '2px 0' }}>
              {line.oldLineNumber || ''}
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)', padding: '2px 0' }}>
              {line.newLineNumber || ''}
            </div>
            <div style={{ padding: '2px 12px', whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {line.type === 'added' && <span style={{ color: '#23c55e', marginRight: '4px' }}>+</span>}
              {line.type === 'removed' && <span style={{ color: '#ef4444', marginRight: '4px' }}>-</span>}
              {line.content || ' '}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <span>{t('diff.lineCount', { count: visibleLines.length })}</span>
        {!embedded ? (
          <button onClick={onClose} className="btn btn-secondary" type="button">
            {t('diff.close')}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {showPartial ? (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={acceptedHunks.size === 0}
                onClick={() => onApplyPartial?.(applyPartialDiff(oldContent, diffLines, acceptedHunks))}
              >
                {resolvedPartialApplyLabel}
              </button>
            ) : null}
            {onApply ? (
              <button onClick={onApply} className="btn btn-primary" type="button">
                {resolvedApplyLabel}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )

  if (embedded) {
    return <div className="diff-viewer-embedded">{panel}</div>
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div onClick={(event) => event.stopPropagation()}>{panel}</div>
    </div>
  )
}

export default DiffViewer
