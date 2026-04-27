import React from 'react'
import { X, RefreshCw, ExternalLink } from 'lucide-react'

interface PreviewPanelProps {
  content: string
  fileName: string
  onClose: () => void
  onRefresh: () => void
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ content, fileName, onClose, onRefresh }) => {
  // 从 HTML 内容中提取可预览的 URL
  const getPreviewUrl = () => {
    if (fileName.endsWith('.html')) {
      const blob = new Blob([content], { type: 'text/html' })
      return URL.createObjectURL(blob)
    }
    return null
  }

  const previewUrl = getPreviewUrl()

  // 创建 srcdoc 用于 iframe
  const getSrcDoc = () => {
    if (fileName.endsWith('.html')) {
      return content
    }
    
    // 对于非 HTML 文件，生成一个预览页面
    const lang = fileName.split('.').pop() || 'text'
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'SF Mono', Monaco, monospace;
              background: #1e1e1e;
              color: #d4d4d4;
              padding: 20px;
              margin: 0;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              line-height: 1.5;
            }
            .header {
              border-bottom: 1px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
              font-size: 14px;
              color: #858585;
            }
          </style>
        </head>
        <body>
          <div class="header">${fileName}</div>
          <pre>${escapedContent}</pre>
        </body>
      </html>
    `
  }

  const openInNewWindow = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank')
    } else {
      const blob = new Blob([getSrcDoc()], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    }
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '50%',
      height: '100%',
      background: 'var(--bg-primary)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50
    }}>
      {/* 预览工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>预览:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{fileName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onRefresh}
            style={{
              padding: '4px 8px',
              background: 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px'
            }}
          >
            <RefreshCw size={12} />
            刷新
          </button>
          <button
            onClick={openInNewWindow}
            style={{
              padding: '4px 8px',
              background: 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px'
            }}
          >
            <ExternalLink size={12} />
            新窗口
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 预览内容 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <iframe
          srcDoc={getSrcDoc()}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: fileName.endsWith('.html') ? 'white' : '#1e1e1e'
          }}
          sandbox="allow-scripts allow-same-origin"
          title="preview"
        />
      </div>
    </div>
  )
}

export default PreviewPanel
