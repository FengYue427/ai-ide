import { FileText } from 'lucide-react'
import { useI18n } from '../i18n'

const cardStyle: React.CSSProperties = {
  padding: '18px',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  background: 'color-mix(in srgb, var(--bg-secondary) 88%, transparent)',
}

interface ProjectRulesSectionProps {
  rulesPreview: string | null
  onEditRules: () => void
}

export function ProjectRulesSection({ rulesPreview, onEditRules }: ProjectRulesSectionProps) {
  const { t } = useI18n()

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <FileText size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>{t('rules.title')}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{t('rules.desc')}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
            {t('rules.injectedHint')}
          </div>
        </div>
      </div>

      {rulesPreview ? (
        <pre
          style={{
            margin: '0 0 12px',
            padding: '12px',
            borderRadius: '10px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            fontSize: '12px',
            lineHeight: 1.5,
            maxHeight: '120px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {rulesPreview.slice(0, 600)}
          {rulesPreview.length > 600 ? '\n…' : ''}
        </pre>
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t('rules.empty')}</div>
      )}

      <button type="button" className="btn btn-secondary" onClick={onEditRules}>
        {rulesPreview ? t('rules.open') : t('rules.create')}
      </button>
    </div>
  )
}
