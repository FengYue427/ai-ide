import React, { useState, useEffect, useRef } from 'react'
import { X, Link2, Copy, Check, Download, Upload, Trash2 } from 'lucide-react'
import { saveShare, generateShareUrl, getAllShares, deleteShare, exportAsJson, importFromJson } from '../services/shareService'

interface ShareModalProps {
  files: { name: string; content: string; language: string }[]
  onImport: (files: { name: string; content: string; language: string }[]) => void
  onClose: () => void
}

const ShareModal: React.FC<ShareModalProps> = ({ files, onImport, onClose }) => {
  const [activeTab, setActiveTab] = useState<'share' | 'history' | 'import'>('share')
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [shares, setShares] = useState(() => Object.values(getAllShares()).sort((a, b) => b.createdAt - a.createdAt))
  const [importText, setImportText] = useState('')
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 清理 timer
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

  const handleShare = () => {
    const id = saveShare({ files })
    const url = generateShareUrl(id)
    setShareUrl(url)
    setShares(Object.values(getAllShares()).sort((a, b) => b.createdAt - a.createdAt))
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    
    // 清理之前的 timer
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current)
    }
    
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false)
      copiedTimerRef.current = null
    }, 2000)
  }

  const handleExport = () => {
    const json = exportAsJson(files)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `project-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const imported = importFromJson(importText)
    if (imported) {
      onImport(imported)
      onClose()
    } else {
      alert('导入失败：无效的 JSON 格式')
    }
  }

  const handleDelete = (id: string) => {
    deleteShare(id)
    setShares(Object.values(getAllShares()).sort((a, b) => b.createdAt - a.createdAt))
  }

  const handleLoad = (shareFiles: { name: string; content: string }[]) => {
    onImport(shareFiles.map(f => ({ ...f, language: 'javascript' })))
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={18} />
            分享 & 导入
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
            {[
              { id: 'share', label: '生成分享' },
              { id: 'history', label: '历史分享' },
              { id: 'import', label: '导入项目' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: activeTab === tab.id ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                  color: activeTab === tab.id ? 'var(--bg-primary)' : 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'share' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!shareUrl ? (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    生成分享链接，他人可通过链接查看此项目
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={handleShare} style={{ flex: 1 }}>
                      <Link2 size={14} style={{ marginRight: '6px' }} />
                      生成分享链接
                    </button>
                    <button className="btn btn-secondary" onClick={handleExport}>
                      <Download size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '13px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleCopy}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? '已复制' : '复制'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {shares.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                  暂无分享记录
                </p>
              ) : (
                shares.map((share) => (
                  <div
                    key={share.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderBottom: '1px solid var(--border-color)',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{share.files.length} 个文件</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(share.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleLoad(share.files)}
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                      >
                        加载
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleDelete(share.id)}
                        style={{ padding: '4px 8px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                粘贴导出的 JSON 文件内容，或从 URL 参数导入 (?share=xxx)
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='{"files": [{"name": "...", "content": "..."}]}'
                style={{
                  height: '120px',
                  padding: '12px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  resize: 'none'
                }}
              />
              <button className="btn btn-primary" onClick={handleImport}>
                <Upload size={14} style={{ marginRight: '6px' }} />
                导入项目
              </button>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
