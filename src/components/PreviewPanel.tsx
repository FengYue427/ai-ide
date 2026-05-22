import React, { useMemo } from 'react'
import { ExternalLink, RefreshCw, X } from 'lucide-react'
import { useI18n } from '../i18n'

interface PreviewPanelProps {
  content: string
  fileName: string
  onClose: () => void
  onRefresh: () => void
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ content, fileName, onClose, onRefresh }) => {
  const { t } = useI18n()
  const isHtml = fileName.endsWith('.html')

  const srcDoc = useMemo(() => {
    if (isHtml) return content

    const escapedContent = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #0f172a;
        color: #e2e8f0;
        margin: 0;
        padding: 24px;
      }
      .card {
        max-width: 920px;
        margin: 0 auto;
        padding: 20px;
        border-radius: 14px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(15, 23, 42, 0.88);
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
      }
      .title {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
        margin-bottom: 14px;
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.6;
        font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="title">${fileName}</div>
      <pre>${escapedContent}</pre>
    </div>
  </body>
</html>`
  }, [content, fileName, isHtml])

  const openInNewWindow = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="preview-shell">
      <div className="preview-toolbar">
        <div className="preview-title-block">
          <div className="preview-kicker">{t('preview.kicker')}</div>
          <div className="preview-title">{fileName || 'Untitled'}</div>
        </div>
        <div className="preview-actions">
          <button onClick={onRefresh}>
            <RefreshCw size={14} />
            <span>{t('preview.refresh')}</span>
          </button>
          <button onClick={openInNewWindow}>
            <ExternalLink size={14} />
            <span>{t('preview.newWindow')}</span>
          </button>
          <button onClick={onClose} className="preview-close" title={t('preview.closeTitle')}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="preview-frame-wrap">
        <iframe
          srcDoc={srcDoc}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: isHtml ? '#ffffff' : '#0f172a',
          }}
          sandbox="allow-scripts allow-same-origin"
          title="preview"
        />
      </div>
    </div>
  )
}

export default PreviewPanel
