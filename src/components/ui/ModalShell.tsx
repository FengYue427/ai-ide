import React from 'react'
import { X } from 'lucide-react'

interface ModalShellProps {
  title: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  footer?: React.ReactNode
  ariaLabel?: string
}

export function ModalShell({
  title,
  onClose,
  children,
  className = '',
  bodyClassName = '',
  footer,
  ariaLabel,
}: ModalShellProps) {
  const labelText = typeof title === 'string' ? title : ariaLabel

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || labelText || '对话框'}
      >
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className={`modal-body ${bodyClassName}`.trim()}>{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  )
}
