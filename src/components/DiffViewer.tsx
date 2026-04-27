import React, { useState, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed'
  oldLineNumber: number | null
  newLineNumber: number | null
  content: string
}

interface DiffViewerProps {
  oldContent: string
  newContent: string
  oldLabel?: string
  newLabel?: string
  onClose: () => void
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldContent,
  newContent,
  oldLabel = '旧版本',
  newLabel = '新版本',
  onClose
}) => {
  const [showUnchanged, setShowUnchanged] = useState(true)

  const diffLines = useMemo(() => {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    const result: DiffLine[] = []
    
    let oldIndex = 0
    let newIndex = 0

    // 简化的 diff 算法
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldLine = oldLines[oldIndex]
      const newLine = newLines[newIndex]

      if (oldIndex >= oldLines.length) {
        // 新增行
        result.push({
          type: 'added',
          oldLineNumber: null,
          newLineNumber: newIndex + 1,
          content: newLine
        })
        newIndex++
      } else if (newIndex >= newLines.length) {
        // 删除行
        result.push({
          type: 'removed',
          oldLineNumber: oldIndex + 1,
          newLineNumber: null,
          content: oldLine
        })
        oldIndex++
      } else if (oldLine === newLine) {
        // 未变更
        result.push({
          type: 'unchanged',
          oldLineNumber: oldIndex + 1,
          newLineNumber: newIndex + 1,
          content: oldLine
        })
        oldIndex++
        newIndex++
      } else {
        // 修改的行 - 简化为删除旧行 + 添加新行
        result.push({
          type: 'removed',
          oldLineNumber: oldIndex + 1,
          newLineNumber: null,
          content: oldLine
        })
        result.push({
          type: 'added',
          oldLineNumber: null,
          newLineNumber: newIndex + 1,
          content: newLine
        })
        oldIndex++
        newIndex++
      }
    }

    return result
  }, [oldContent, newContent])

  const stats = useMemo(() => {
    const added = diffLines.filter(l => l.type === 'added').length
    const removed = diffLines.filter(l => l.type === 'removed').length
    const unchanged = diffLines.filter(l => l.type === 'unchanged').length
    return { added, removed, unchanged, total: diffLines.length }
  }, [diffLines])

  const visibleLines = showUnchanged 
    ? diffLines 
    : diffLines.filter(l => l.type !== 'unchanged')

  const getLineStyle = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return { background: 'rgba(35, 197, 94, 0.15)', borderLeft: '3px solid #23c55e' }
      case 'removed':
        return { background: 'rgba(239, 68, 68, 0.15)', borderLeft: '3px solid #ef4444' }
      default:
        return { background: 'transparent', borderLeft: '3px solid transparent' }
    }
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
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
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
            <input
              type="checkbox"
              checked={showUnchanged}
              onChange={(e) => setShowUnchanged(e.target.checked)}
            />
            显示未变更
          </label>

          <button onClick={onClose} style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Column Headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px 60px 1fr',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            padding: '8px 0'
          }}
        >
          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>{oldLabel}</div>
          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>{newLabel}</div>
          <div style={{ paddingLeft: '12px' }}>内容</div>
        </div>

        {/* Diff Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.6'
          }}
        >
          {visibleLines.map((line, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 60px 1fr',
                ...getLineStyle(line.type)
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  borderRight: '1px solid var(--border-color)',
                  padding: '2px 0'
                }}
              >
                {line.oldLineNumber || ''}
              </div>
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  borderRight: '1px solid var(--border-color)',
                  padding: '2px 0'
                }}
              >
                {line.newLineNumber || ''}
              </div>
              <div
                style={{
                  padding: '2px 12px',
                  whiteSpace: 'pre',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {line.type === 'added' && <span style={{ color: '#23c55e', marginRight: '4px' }}>+</span>}
                {line.type === 'removed' && <span style={{ color: '#ef4444', marginRight: '4px' }}>-</span>}
                {line.content || ' '}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}
        >
          <span>共 {visibleLines.length} 行</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn btn-secondary">
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiffViewer
