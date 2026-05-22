import React from 'react'
import { FileCode2 } from 'lucide-react'
import { useI18n } from '../i18n'
import { templates, applyTemplate } from '../templates'
import { ModalShell } from './ui/ModalShell'

interface TemplateModalProps {
  onSelect: (files: { name: string; content: string; language: string }[]) => void
  onClose: () => void
}

const TemplateModal: React.FC<TemplateModalProps> = ({ onSelect, onClose }) => {
  const { t } = useI18n()

  return (
    <ModalShell
      className="modal--template"
      ariaLabel={t('template.title')}
      title={
        <span className="modal-title-row">
          <FileCode2 size={18} />
          {t('template.title')}
        </span>
      }
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
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
            <span className="template-card__meta">
              {t('template.fileCount', { count: Object.keys(template.files).length })}
            </span>
          </button>
        ))}
      </div>
    </ModalShell>
  )
}

export default TemplateModal
