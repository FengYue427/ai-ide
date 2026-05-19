import React from 'react'
import { X } from 'lucide-react'

interface ModalShellProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  ariaLabel?: string
}

export function ModalShell({
  title,
  onClose,
  children,
  className = '',
  bodyClassName = '',
  ariaLabel,
}: ModalShellProps) {
  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
      >
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className={`modal-body ${bodyClassName}`.trim()}>{children}</div>
      </div>
    </div>
  )
}
