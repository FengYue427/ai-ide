import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Download, Link2, Trash2, Upload } from 'lucide-react'
import { useI18n } from '../i18n'
import { deleteShare, exportAsJson, generateShareUrl, getAllShares, importFromJson, saveShare } from '../services/shareService'
import { ModalShell } from './ui/ModalShell'

interface ShareModalProps {
  files: { name: string; content: string; language: string }[]
  onImport: (files: { name: string; content: string; language: string }[]) => void
  onClose: () => void
}

const ShareModal: React.FC<ShareModalProps> = ({ files, onImport, onClose }) => {
  const { t } = useI18n()
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
      setError(t('share.importFailed'))
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
      ariaLabel={t('share.aria')}
      title={
        <span className="modal-title-row">
          <Link2 size={18} />
          {t('share.title')}
        </span>
      }
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.close')}
        </button>
      }
    >
      <div className="share-hero">
        <div className="share-hero__title">{t('share.hero.title')}</div>
        <div className="share-hero__desc">{t('share.hero.desc')}</div>
        <div className="share-hero__meta">
          <span className="status-pill">{t('share.meta.files', { count: files.length })}</span>
          <span className="status-pill">{t('share.meta.chars', { count: totalChars.toLocaleString() })}</span>
        </div>
      </div>

      <div className="share-tabs">
        {(
          [
            { id: 'share' as const, label: t('share.tab.share') },
            { id: 'history' as const, label: t('share.tab.history') },
            { id: 'import' as const, label: t('share.tab.import') },
          ] as const
        ).map((tab) => (
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
                <p className="share-hint">{t('share.createHint')}</p>
                <div className="share-actions-row">
                  <button type="button" className="btn btn-primary" onClick={handleShare}>
                    <Link2 size={14} className="btn-icon-gap" />
                    {t('share.generateLink')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleExport}>
                    <Download size={14} className="btn-icon-gap" />
                    {t('share.exportJson')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="import-stack">
                <p className="share-hint">{t('share.linkReady')}</p>
                <div className="share-copy-row">
                  <input type="text" className="form-input" value={shareUrl} readOnly />
                  <button type="button" className="btn btn-primary" onClick={handleCopy}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span className="btn-icon-gap">{copied ? t('collab.copied') : t('share.copy')}</span>
                  </button>
                </div>
                <button type="button" className="btn btn-secondary" onClick={handleShare}>
                  {t('share.regenerate')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="share-history-list">
          {shares.length === 0 ? (
            <div className="modal-surface share-empty">{t('share.empty')}</div>
          ) : (
            shares.map((share) => (
              <div key={share.id} className="modal-surface share-history-item">
                <div>
                  <div className="share-history-title">{t('share.historyFiles', { count: share.files.length })}</div>
                  <div className="share-history-time">{new Date(share.createdAt).toLocaleString()}</div>
                </div>
                <div className="share-history-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => handleLoad(share.files)}>
                    {t('share.load')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleDelete(share.id)}
                    title={t('share.deleteTitle')}
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
        <div className="share-stack">
          <div className="modal-surface">
            <p className="share-hint share-hint--spaced">{t('share.importHint')}</p>
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
            {t('share.importProject')}
          </button>
        </div>
      )}
    </ModalShell>
  )
}

export default ShareModal
