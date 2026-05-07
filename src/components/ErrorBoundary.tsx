import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: '' }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
    this.setState({ errorInfo: errorInfo.componentStack })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleResetStorage = () => {
    if (confirm('确定要清除所有本地数据吗？这将删除所有保存的项目和设置。')) {
      try {
        localStorage.clear()
        indexedDB.deleteDatabase('aide-unified-storage')
        window.location.reload()
      } catch (e) {
        alert('清除失败: ' + (e as Error).message)
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            background: 'var(--bg-primary, #0f172a)',
            color: 'var(--text-primary, #e2e8f0)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            zIndex: 9999
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              maxWidth: '600px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={32} color="#ef4444" />
            </div>

            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
              出错了
            </h1>

            <p style={{ margin: 0, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6 }}>
              AI IDE 遇到了意外错误。你可以尝试刷新页面，或者清除本地数据后重试。
            </p>

            {this.state.error && (
              <div
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: '200px',
                  color: '#fca5a5'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                  {this.state.error.message}
                </div>
                {this.state.errorInfo && (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', opacity: 0.8 }}>
                    {this.state.errorInfo}
                  </pre>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'var(--accent-color, #3b82f6)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
              >
                <RotateCcw size={16} />
                刷新页面
              </button>

              <button
                onClick={this.handleResetStorage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={16} />
                清除本地数据
              </button>
            </div>

            <p style={{ margin: '16px 0 0', fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
              纯前端版本 · 所有数据存储在本地浏览器中
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
