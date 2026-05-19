import { FileText } from 'lucide-react'

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
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <FileText size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>项目规则</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            编辑 <code>.aide/rules.md</code> 或 <code>.cursorrules</code>，内容会自动注入 Chat / Agent 的 system prompt。
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
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          尚未检测到规则文件。点击下方按钮在编辑器中创建模板。
        </div>
      )}

      <button type="button" className="btn btn-secondary" onClick={onEditRules}>
        {rulesPreview ? '在编辑器中打开规则' : '创建 .aide/rules.md'}
      </button>
    </div>
  )
}
