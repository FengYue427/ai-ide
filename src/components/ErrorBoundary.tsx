import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react'
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
      this.setState({ resetError: `清除失败：${(error as Error).message}`, showResetConfirm: false })
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          background: 'var(--bg-primary, #0f172a)',
          color: 'var(--text-primary, #e2e8f0)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: 9999,
        }}
      >
        <div style={{ display: 'grid', gap: '20px', maxWidth: '620px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <AlertTriangle size={32} color="#ef4444" />
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>应用遇到错误</h1>
            <p style={{ margin: '10px 0 0', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6 }}>
              AI IDE 遇到了意外错误。你可以刷新页面，或在必要时清除本地数据后重试。
            </p>
          </div>

          {this.state.error && (
            <div style={{ width: '100%', padding: '16px', background: 'rgba(239, 68, 68, 0.10)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.30)', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '12px', textAlign: 'left', overflow: 'auto', maxHeight: '220px', color: '#fca5a5' }}>
              <div style={{ fontWeight: 700, marginBottom: '8px' }}>{this.state.error.message}</div>
              {this.state.errorInfo && <pre style={{ margin: 0, whiteSpace: 'pre-wrap', opacity: 0.8 }}>{this.state.errorInfo}</pre>}
            </div>
          )}

          {this.state.resetError && (
            <div style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', fontSize: '13px' }}>
              {this.state.resetError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={this.handleReload} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={16} />
              刷新页面
            </button>
            <button onClick={() => this.setState({ showResetConfirm: true })} className="btn btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={16} />
              清除本地数据
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
            前端运行时错误 · 本地项目数据存储在当前浏览器中
          </p>
        </div>

        {this.state.showResetConfirm && (
          <div className="confirm-overlay" onClick={() => this.setState({ showResetConfirm: false })}>
            <div className="confirm-dialog" onClick={(event) => event.stopPropagation()}>
              <button className="toast-close" onClick={() => this.setState({ showResetConfirm: false })} style={{ position: 'absolute', right: 18, top: 18 }}>
                <X size={14} />
              </button>
              <div className="confirm-icon confirm-icon-danger">
                <AlertTriangle size={20} />
              </div>
              <div className="confirm-body">
                <div className="confirm-title">清除所有本地数据</div>
                <div className="confirm-message">这会删除保存在浏览器里的项目、设置和缓存。确认后页面会自动刷新。</div>
              </div>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => this.setState({ showResetConfirm: false })}>取消</button>
                <button className="btn btn-danger" onClick={this.handleResetStorage}>清除</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}
