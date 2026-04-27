import React from 'react'
import { Play, Square, Trash2 } from 'lucide-react'

interface TerminalProps {
  output: string[]
  isRunning: boolean
  onRun: () => void
  onClear: () => void
}

const Terminal: React.FC<TerminalProps> = ({ output, isRunning, onRun, onClear }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '200px',
      background: 'var(--bg-primary)',
      borderTop: '1px solid var(--border-color)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          终端
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onRun}
            disabled={isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              background: isRunning ? 'var(--bg-tertiary)' : 'var(--accent-color)',
              color: isRunning ? 'var(--text-secondary)' : 'var(--bg-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: isRunning ? 'not-allowed' : 'pointer'
            }}
          >
            {isRunning ? <Square size={12} /> : <Play size={12} />}
            {isRunning ? '运行中' : '运行'}
          </button>
          <button
            onClick={onClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={12} />
            清空
          </button>
        </div>
      </div>
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px',
        fontFamily: "'SF Mono', Monaco, monospace",
        fontSize: '13px',
        lineHeight: '1.6'
      }}>
        {output.length === 0 ? (
          <span style={{ color: 'var(--text-secondary)' }}>
            点击"运行"执行代码...
          </span>
        ) : (
          output.map((line, idx) => (
            <div key={idx} style={{ color: 'var(--text-primary)' }}>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Terminal
