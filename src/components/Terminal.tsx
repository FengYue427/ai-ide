import React from 'react'
import { Play, Square, Trash2 } from 'lucide-react'
import { useI18n } from '../i18n'

interface TerminalProps {
  output: string[]
  isRunning: boolean
  onRun: () => void
  onClear: () => void
}

const Terminal: React.FC<TerminalProps> = ({ output, isRunning, onRun, onClear }) => {
  const { t } = useI18n()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '200px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('terminal.title')}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onRun}
            disabled={isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              fontSize: '12px',
              background: isRunning ? 'var(--bg-tertiary)' : 'var(--accent-color)',
              color: isRunning ? 'var(--text-secondary)' : '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: 700,
            }}
          >
            {isRunning ? <Square size={12} /> : <Play size={12} />}
            {isRunning ? t('terminal.running') : t('terminal.run')}
          </button>
          <button
            onClick={onClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              fontSize: '12px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            <Trash2 size={12} />
            {t('terminal.clear')}
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px', fontFamily: 'ui-monospace, SFMono-Regular, Monaco, monospace', fontSize: '13px', lineHeight: '1.6' }}>
        {output.length === 0 ? (
          <span style={{ color: 'var(--text-secondary)' }}>{t('terminal.hint')}</span>
        ) : (
          output.map((line, index) => (
            <div key={index} style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Terminal
