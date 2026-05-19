import React, { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
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
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldContent,
  newContent,
  oldLabel = '旧版本',
  newLabel = '新版本',
  onClose,
  embedded = false,
  onApply,
  applyLabel = '应用',
  enablePartialApply = false,
  onApplyPartial,
  partialApplyLabel = '应用已选块',
}) => {
  const [showUnchanged, setShowUnchanged] = useState(true)

  const diffLines = useMemo(() => computeLineDiff(oldContent, newContent), [oldContent, newContent])
  const hunks = useMemo(() => groupDiffHunks(diffLines), [diffLines])
  const [acceptedHunks, setAcceptedHunks] = useState(() => defaultAcceptedHunks(diffLines))

  useEffect(() => {
    setAcceptedHunks(defaultAcceptedHunks(diffLines))
  }, [diffLines])

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
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>代码对比</h3>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
          <span style={{ color: '#23c55e' }}>+{stats.added} 新增</span>
          <span style={{ color: '#ef4444' }}>-{stats.removed} 删除</span>
          <span style={{ color: 'var(--text-secondary)' }}>{stats.unchanged} 未变更</span>
        </div>
        <div style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showUnchanged} onChange={(event) => setShowUnchanged(event.target.checked)} />
          显示未变更
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
            变更块 {acceptedHunks.size}/{hunks.length}：
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
                块 {index + 1} (+{added}/-{removed})
              </label>
            )
          })}
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => setAcceptedHunks(defaultAcceptedHunks(diffLines))}
          >
            全选
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => setAcceptedHunks(new Set())}
          >
            全不选
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
        <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>{oldLabel}</div>
        <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>{newLabel}</div>
        <div style={{ paddingLeft: '12px' }}>内容</div>
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
        <span>共 {visibleLines.length} 行</span>
        {!embedded ? (
          <button onClick={onClose} className="btn btn-secondary" type="button">
            关闭
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
                {partialApplyLabel}
              </button>
            ) : null}
            {onApply ? (
              <button onClick={onApply} className="btn btn-primary" type="button">
                {applyLabel}
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
