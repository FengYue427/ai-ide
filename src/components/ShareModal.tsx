import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Download, Link2, Trash2, Upload } from 'lucide-react'
import { deleteShare, exportAsJson, generateShareUrl, getAllShares, importFromJson, saveShare } from '../services/shareService'
import { ModalShell } from './ui/ModalShell'

interface ShareModalProps {
  files: { name: string; content: string; language: string }[]
  onImport: (files: { name: string; content: string; language: string }[]) => void
  onClose: () => void
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
    <ModalShell
      className="modal--share"
      bodyClassName="modal-body--stack"
      ariaLabel="分享与导入"
      title={
        <span className="modal-title-row">
          <Link2 size={18} />
          分享与导入
        </span>
      }
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          关闭
        </button>
      }
    >
      <div className="share-hero">
        <div className="share-hero__title">当前工作区快照</div>
        <div className="share-hero__desc">
          你可以生成分享链接、导出 JSON 备份，或者从历史快照与 JSON 文本恢复项目。
        </div>
        <div className="share-hero__meta">
          <span className="status-pill">{files.length} 个文件</span>
          <span className="status-pill">{totalChars.toLocaleString()} 字符</span>
        </div>
      </div>

      <div className="share-tabs">
        {[
          { id: 'share' as const, label: '创建分享' },
          { id: 'history' as const, label: '历史记录' },
          { id: 'import' as const, label: '导入 JSON' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`share-tab ${activeTab === tab.id ? 'share-tab--active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id)
              setError('')
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'share' && (
        <div className="share-stack">
          <div className="modal-surface">
            {!shareUrl ? (
              <div className="import-stack">
                <p className="share-hint">
                  生成一个本地分享快照链接，方便你稍后恢复，或分享给同一环境里的其他人使用。
                </p>
                <div className="share-actions-row">
                  <button type="button" className="btn btn-primary" onClick={handleShare}>
                    <Link2 size={14} className="btn-icon-gap" />
                    生成分享链接
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleExport}>
                    <Download size={14} className="btn-icon-gap" />
                    导出 JSON
                  </button>
                </div>
              </div>
            ) : (
              <div className="import-stack">
                <p className="share-hint">链接已生成，现在可以复制或重新生成。</p>
                <div className="share-copy-row">
                  <input type="text" className="form-input" value={shareUrl} readOnly />
                  <button type="button" className="btn btn-primary" onClick={handleCopy}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span className="btn-icon-gap">{copied ? '已复制' : '复制'}</span>
                  </button>
                </div>
                <button type="button" className="btn btn-secondary" onClick={handleShare}>
                  重新生成
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="share-history-list">
          {shares.length === 0 ? (
            <div className="modal-surface share-empty">还没有保存过分享快照。</div>
          ) : (
            shares.map((share) => (
              <div key={share.id} className="modal-surface share-history-item">
                <div>
                  <div className="share-history-title">{share.files.length} 个文件</div>
                  <div className="share-history-time">{new Date(share.createdAt).toLocaleString()}</div>
                </div>
                <div className="share-history-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => handleLoad(share.files)}>
                    加载
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => handleDelete(share.id)} title="删除">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'import' && (
        <div className="share-stack">
          <div className="modal-surface">
            <p className="share-hint share-hint--spaced">
              粘贴导出的 JSON 内容即可恢复项目。也支持通过 URL 参数 `?share=xxx` 进入分享恢复流程。
            </p>
            <textarea
              className="share-code-textarea"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder='{"files":[{"name":"src/App.tsx","content":"..."}]}'
            />
          </div>

          {error && <div className="alert-banner alert-banner--error">{error}</div>}

          <button type="button" className="btn btn-primary" onClick={handleImport}>
            <Upload size={14} className="btn-icon-gap" />
            导入项目
          </button>
        </div>
      )}
    </ModalShell>
  )
}

export default ShareModal
