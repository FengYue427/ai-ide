import React from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../../i18n'

interface ModalShellProps {
  title: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  footer?: React.ReactNode
  ariaLabel?: string
  /** Render above another open modal (subscription → pay). */
  elevated?: boolean
}

export function ModalShell({
  title,
  onClose,
  children,
  className = '',
  bodyClassName = '',
  footer,
  ariaLabel,
  elevated = false,
}: ModalShellProps) {
  const { t } = useI18n()
  const labelText = typeof title === 'string' ? title : ariaLabel

  return (
    <div
      className={`modal-overlay${elevated ? ' modal-overlay--elevated' : ''}`.trim()}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`modal ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || labelText || t('modal.dialog')}
      >
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>
        <div className={`modal-body ${bodyClassName}`.trim()}>{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  )
}
