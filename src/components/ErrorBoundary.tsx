import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react'
import { createTranslator, useI18n } from '../i18n'
import { normalizeLanguage } from '../lib/language'
import { reportError } from '../lib/observability'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string
  resetError: string | null
  showResetConfirm: boolean
}

function ErrorBoundaryFallback({
  error,
  errorInfo,
  resetError,
  showResetConfirm,
  onReload,
  onShowResetConfirm,
  onHideResetConfirm,
  onResetStorage,
}: {
  error: Error | null
  errorInfo: string
  resetError: string | null
  showResetConfirm: boolean
  onReload: () => void
  onShowResetConfirm: () => void
  onHideResetConfirm: () => void
  onResetStorage: () => void
}) {
  const { t } = useI18n()

  return (
    <div className="shell-fatal-overlay">
      <div style={{ display: 'grid', gap: '20px', maxWidth: '620px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <AlertTriangle size={32} color="#ef4444" />
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>{t('errorBoundary.title')}</h1>
          <p style={{ margin: '10px 0 0', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6 }}>
            {t('errorBoundary.desc')}
          </p>
        </div>

        {error && (
          <div style={{ width: '100%', padding: '16px', background: 'rgba(239, 68, 68, 0.10)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.30)', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '12px', textAlign: 'left', overflow: 'auto', maxHeight: '220px', color: '#fca5a5' }}>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>{error.message}</div>
            {errorInfo && <pre style={{ margin: 0, whiteSpace: 'pre-wrap', opacity: 0.8 }}>{errorInfo}</pre>}
          </div>
        )}

        {resetError && (
          <div style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', fontSize: '13px' }}>
            {resetError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onReload} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={16} />
            {t('errorBoundary.refresh')}
          </button>
          <button onClick={onShowResetConfirm} className="btn btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={16} />
            {t('errorBoundary.clearLocal')}
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
          {t('errorBoundary.hint')}
        </p>
      </div>

      {showResetConfirm && (
        <div className="confirm-overlay" onClick={onHideResetConfirm}>
          <div className="confirm-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="toast-close" onClick={onHideResetConfirm} style={{ position: 'absolute', right: 18, top: 18 }}>
              <X size={14} />
            </button>
            <div className="confirm-icon confirm-icon-danger">
              <AlertTriangle size={20} />
            </div>
            <div className="confirm-body">
              <div className="confirm-title">{t('errorBoundary.confirm.title')}</div>
              <div className="confirm-message">{t('errorBoundary.confirm.message')}</div>
            </div>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={onHideResetConfirm}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={onResetStorage}>{t('errorBoundary.confirm.clear')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: '', resetError: null, showResetConfirm: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: '' }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportError(error, {
      source: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
    })
    this.setState({ errorInfo: errorInfo.componentStack || '' })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleResetStorage = () => {
    try {
      localStorage.clear()
      indexedDB.deleteDatabase('aide-unified-storage')
      window.location.reload()
    } catch (error) {
      const stored = localStorage.getItem('language') ?? 'zh-CN'
      const t = createTranslator(normalizeLanguage(stored))
      this.setState({
        resetError: t('errorBoundary.clearFailed', { message: (error as Error).message }),
        showResetConfirm: false,
      })
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <ErrorBoundaryFallback
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        resetError={this.state.resetError}
        showResetConfirm={this.state.showResetConfirm}
        onReload={this.handleReload}
        onShowResetConfirm={() => this.setState({ showResetConfirm: true })}
        onHideResetConfirm={() => this.setState({ showResetConfirm: false })}
        onResetStorage={this.handleResetStorage}
      />
    )
  }
}
