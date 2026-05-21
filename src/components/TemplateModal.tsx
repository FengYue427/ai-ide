import React from 'react'
import { FileCode2 } from 'lucide-react'
import { templates, applyTemplate } from '../templates'
import { ModalShell } from './ui/ModalShell'

interface TemplateModalProps {
  onSelect: (files: { name: string; content: string; language: string }[]) => void
  onClose: () => void
}

const TemplateModal: React.FC<TemplateModalProps> = ({ onSelect, onClose }) => {
  return (
    <ModalShell
      className="modal--template"
      ariaLabel="选择项目模板"
      title={
        <span className="modal-title-row">
          <FileCode2 size={18} />
          选择项目模板
        </span>
      }
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          取消
        </button>
      }
    >
      <div className="template-grid">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            className="template-card"
            onClick={() => {
              const files = applyTemplate(template)
              onSelect(files)
            }}
          >
            <span className="template-card__icon">{template.icon}</span>
            <span className="template-card__name">{template.name}</span>
            <span className="template-card__desc">{template.description}</span>
            <span className="template-card__meta">{Object.keys(template.files).length} 个文件</span>
          </button>
        ))}
      </div>
    </ModalShell>
  )
}

export default TemplateModal
