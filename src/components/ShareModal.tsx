import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Download, Link2, Trash2, Upload, X } from 'lucide-react'
import { deleteShare, exportAsJson, generateShareUrl, getAllShares, importFromJson, saveShare } from '../services/shareService'

interface ShareModalProps {
  files: { name: string; content: string; language: string }[]
  onImport: (files: { name: string; content: string; language: string }[]) => void
  onClose: () => void
}

const surfaceStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
}

const ShareModal: React.FC<ShareModalProps> = ({ files, onImport, onClose }) => {
  const [activeTab, setActiveTab] = useState<'share' | 'history' | 'import'>('share')
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [importText, setImportText] = useState('')
  const [error, setError] = useState('')
  const [shares, setShares] = useState(() => Object.values(getAllShares()).sort((a, b) => b.createdAt - a.createdAt))
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  const totalChars = useMemo(() => files.reduce((sum, file) => sum + file.content.length, 0), [files])

  const refreshShares = () => {
    setShares(Object.values(getAllShares()).sort((a, b) => b.createdAt - a.createdAt))
  }

  const handleShare = () => {
    const id = saveShare({ files })
    setShareUrl(generateShareUrl(id))
    refreshShares()
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false)
      copiedTimerRef.current = null
    }, 1800)
  }

  const handleExport = () => {
    const json = exportAsJson(files)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `project-${Date.now()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    setError('')
    const imported = importFromJson(importText)
    if (!imported) {
      setError('导入失败，请检查 JSON 结构是否正确。')
      return
    }
    onImport(imported)
    onClose()
  }

  const handleDelete = (id: string) => {
    deleteShare(id)
    refreshShares()
  }

  const handleLoad = (shareFiles: { name: string; content: string }[]) => {
    onImport(shareFiles.map((file) => ({ ...file, language: 'javascript' })))
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '640px', maxWidth: '92vw' }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={18} />
            分享与导入
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>

        <div className="modal-body" style={{ display: 'grid', gap: '16px' }}>
          <div
            style={{
              ...surfaceStyle,
              background: 'linear-gradient(135deg, rgba(124,156,255,0.10), transparent 75%)',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>当前工作区快照</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              你可以生成分享链接、导出 JSON 备份，或者从历史快照与 JSON 文本恢复项目。
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              <span className="status-pill">{files.length} 个文件</span>
              <span className="status-pill">{totalChars.toLocaleString()} 字符</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'share', label: '创建分享' },
              { id: 'history', label: '历史记录' },
              { id: 'import', label: '导入 JSON' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab)
                  setError('')
                }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: `1px solid ${activeTab === tab.id ? 'color-mix(in srgb, var(--accent-color) 34%, var(--border-color))' : 'var(--border-color)'}`,
                  background: activeTab === tab.id ? 'color-mix(in srgb, var(--accent-color) 10%, transparent)' : 'var(--bg-tertiary)',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'share' && (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={surfaceStyle}>
                {!shareUrl ? (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      生成一个本地分享快照链接，方便你稍后恢复，或分享给同一环境里的其他人使用。
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" onClick={handleShare}>
                        <Link2 size={14} style={{ marginRight: '6px' }} />
                        生成分享链接
                      </button>
                      <button className="btn btn-secondary" onClick={handleExport}>
                        <Download size={14} style={{ marginRight: '6px' }} />
                        导出 JSON
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>链接已生成，现在可以复制或重新生成。</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                        }}
                      />
                      <button className="btn btn-primary" onClick={handleCopy}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span style={{ marginLeft: '6px' }}>{copied ? '已复制' : '复制'}</span>
                      </button>
                    </div>
                    <div>
                      <button className="btn btn-secondary" onClick={handleShare}>
                        重新生成
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ display: 'grid', gap: '10px', maxHeight: '360px', overflow: 'auto' }}>
              {shares.length === 0 ? (
                <div style={{ ...surfaceStyle, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  还没有保存过分享快照。
                </div>
              ) : (
                shares.map((share) => (
                  <div
                    key={share.id}
                    style={{
                      ...surfaceStyle,
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{share.files.length} 个文件</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(share.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary" onClick={() => handleLoad(share.files)}>
                        加载
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleDelete(share.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={surfaceStyle}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                  粘贴导出的 JSON 内容即可恢复项目。也支持通过 URL 参数 `?share=xxx` 进入分享恢复流程。
                </div>
                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  placeholder='{"files":[{"name":"src/App.tsx","content":"..."}]}'
                  style={{
                    width: '100%',
                    height: '160px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {error && (
                <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(248,81,73,0.1)', color: '#ff7b72', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <div>
                <button className="btn btn-primary" onClick={handleImport}>
                  <Upload size={14} style={{ marginRight: '6px' }} />
                  导入项目
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
