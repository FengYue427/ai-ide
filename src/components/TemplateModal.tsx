import React from 'react'
import { X, FileCode2 } from 'lucide-react'
import { templates, applyTemplate } from '../templates'

interface TemplateModalProps {
  onSelect: (files: { name: string; content: string; language: string }[]) => void
  onClose: () => void
}

const TemplateModal: React.FC<TemplateModalProps> = ({ onSelect, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '600px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode2 size={18} />
            选择项目模板
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  const files = applyTemplate(template)
                  onSelect(files)
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '16px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  color: 'var(--text-primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-color)'
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.background = 'var(--bg-primary)'
                }}
              >
                <span style={{ fontSize: '32px' }}>{template.icon}</span>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>{template.name}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {template.description}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--accent-color)' }}>
                  {Object.keys(template.files).length} 个文件
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

export default TemplateModal
