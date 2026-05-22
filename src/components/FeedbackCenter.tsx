import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useI18n } from '../i18n'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  kind: ToastKind
  title: string
  detail?: string
}

export interface ConfirmRequest {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: 'default' | 'danger'
}

interface FeedbackCenterProps {
  toasts: ToastMessage[]
  confirmRequest: ConfirmRequest | null
  onDismissToast: (id: number) => void
  onResolveConfirm: (confirmed: boolean) => void
}

const toastIcon = {
  success: <CheckCircle2 size={16} />,
  error: <AlertTriangle size={16} />,
  info: <Info size={16} />,
}

export function FeedbackCenter({
  toasts,
  confirmRequest,
  onDismissToast,
  onResolveConfirm,
}: FeedbackCenterProps) {
  const { t } = useI18n()

  return (
    <>
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.kind}`}>
            <div className="toast-icon">{toastIcon[toast.kind]}</div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              {toast.detail && <div className="toast-detail">{toast.detail}</div>}
            </div>
            <button className="toast-close" onClick={() => onDismissToast(toast.id)} aria-label={t('feedback.closeToast')}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {confirmRequest && (
        <div className="confirm-overlay" onClick={() => onResolveConfirm(false)}>
          <div className="confirm-dialog" onClick={(event) => event.stopPropagation()}>
            <div className={`confirm-icon ${confirmRequest.tone === 'danger' ? 'confirm-icon-danger' : ''}`}>
              <AlertTriangle size={20} />
            </div>
            <div className="confirm-body">
              <div className="confirm-title">{confirmRequest.title}</div>
              <div className="confirm-message">{confirmRequest.message}</div>
            </div>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => onResolveConfirm(false)}>
                {confirmRequest.cancelText || t('common.cancel')}
              </button>
              <button
                className={confirmRequest.tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
                onClick={() => onResolveConfirm(true)}
              >
                {confirmRequest.confirmText || t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
