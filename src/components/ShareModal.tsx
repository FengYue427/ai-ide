import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Download, Link2, Loader2, Trash2, Upload } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  createShare,
  exportAsJson,
  generateShareProgressUrl,
  getShareFileCount,
  importFromJson,
  listShareHistory,
  loadShareById,
  removeShare,
  type ShareHistoryEntry,
} from '../services/shareService'
import {
  appendIntentSnapshotToShareFiles,
  buildIntentShareSnapshot,
  formatIntentShareSummary,
} from '../services/intentOs/intentShareSnapshotService'
import { listSpecTasksPaths } from '../services/planSpecsBridgeService'
import { isPlanGatedTierCEnabled } from '../lib/planFeatureGate'
import { saveIntentShellPreference } from '../lib/intentShellFeatures'
import { useIDEStore } from '../store/ideStore'
import {
  applyIntentShareSnapshotContent,
  parseIntentShareSnapshot,
} from '../services/intentOs/intentShareImportService'
import { PROOF_REPORT_PREFIX } from '../services/intentOs/proofOfDoneReportService'
import { UpgradeEntitlementHint } from './UpgradeEntitlementHint'
import { emitAideLinkEvent } from '../lib/aideLinkBus'
import { ModalShell } from './ui/ModalShell'

interface ShareModalProps {
  files: { name: string; content: string; language: string }[]
  onImport: (files: { name: string; content: string; language: string }[]) => void
  onClose: () => void
  initialTab?: 'share' | 'progress' | 'history' | 'import'
}

const ShareModal: React.FC<ShareModalProps> = ({ files, onImport, onClose, initialTab = 'share' }) => {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'share' | 'history' | 'import' | 'progress'>(initialTab)
  const [shareUrl, setShareUrl] = useState('')
  const [shareId, setShareId] = useState('')
  const [shareCloud, setShareCloud] = useState(false)
  const [creating, setCreating] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [loadingShareId, setLoadingShareId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedProgress, setCopiedProgress] = useState(false)
  const [importText, setImportText] = useState('')
  const [error, setError] = useState('')
  const [shares, setShares] = useState<ShareHistoryEntry[]>([])
  const [includeIntentSnapshot, setIncludeIntentSnapshot] = useState(true)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasIntentSpecs = useMemo(
    () => listSpecTasksPaths(files.map((f) => ({ name: f.name, content: f.content }))).length > 0,
    [files],
  )
  const intentShareSummary = useMemo(() => {
    if (!hasIntentSpecs) return ''
    return formatIntentShareSummary(buildIntentShareSnapshot(files))
  }, [files, hasIntentSpecs])

  const intentSharePreview = useMemo(() => {
    if (!isPlanGatedTierCEnabled('intentShareImport') || !importText.trim()) return null
    return parseIntentShareSnapshot(importText.trim())
  }, [importText])

  const proofHtmlFiles = useMemo(
    () => files.filter((f) => f.name.startsWith(PROOF_REPORT_PREFIX) && f.name.endsWith('.html')),
    [files],
  )
  const [proofPreviewPath, setProofPreviewPath] = useState<string | null>(null)
  const proofPreviewContent = useMemo(() => {
    if (!proofPreviewPath) return proofHtmlFiles[proofHtmlFiles.length - 1]?.content ?? ''
    return files.find((f) => f.name === proofPreviewPath)?.content ?? ''
  }, [files, proofHtmlFiles, proofPreviewPath])

  const sharePayload = useMemo(() => {
    if (!includeIntentSnapshot || !hasIntentSpecs) return files
    return appendIntentSnapshotToShareFiles(files)
  }, [files, hasIntentSpecs, includeIntentSnapshot])

  const refreshShares = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const next = await listShareHistory()
      setShares(next)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (activeTab === 'history') {
      void refreshShares()
    }
  }, [activeTab, refreshShares])

  const totalChars = useMemo(() => files.reduce((sum, file) => sum + file.content.length, 0), [files])

  const handleShare = () => {
    setCreating(true)
    setError('')
    void createShare(sharePayload)
      .then((result) => {
        setShareUrl(result.url)
        setShareId(result.id)
        setShareCloud(result.cloud)
        emitAideLinkEvent('share-created', { shareId: result.id, cloud: result.cloud })
        void refreshShares()
      })
      .catch(() => {
        setError(t('share.createFailed'))
      })
      .finally(() => {
        setCreating(false)
      })
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

  const handleCopyProgressLink = async () => {
    if (!shareId) return
    await navigator.clipboard.writeText(generateShareProgressUrl(shareId))
    setCopiedProgress(true)
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => {
      setCopiedProgress(false)
      copiedTimerRef.current = null
    }, 1800)
  }

  const handleExport = () => {
    const json = exportAsJson(
      (includeIntentSnapshot && hasIntentSpecs ? appendIntentSnapshotToShareFiles(files) : files).map((f) => ({
        name: f.name,
        content: f.content,
      })),
    )
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

  const handleApplyIntentShare = () => {
    if (!isPlanGatedTierCEnabled('intentShareImport')) {
      useIDEStore.getState().setShowSubscriptionModal(true)
      return
    }
    setError('')
    const focus = applyIntentShareSnapshotContent(importText.trim())
    if (!focus) {
      setError(t('share.intent.importInvalid'))
      return
    }
    const store = useIDEStore.getState()
    store.setIntentShellFocusTasksPath(focus.focusTasksPath)
    store.setIntentReplayGraphOverlay(focus.snapshot.graph)
    store.setIntentShellEnabled(true)
    saveIntentShellPreference(true)
    onClose()
  }

  const handleDelete = (share: ShareHistoryEntry) => {
    void removeShare(share.id, share.cloud).finally(() => {
      void refreshShares()
    })
  }

  const handleLoad = (share: ShareHistoryEntry) => {
    const applyFiles = (loaded: ShareHistoryEntry['files']) => {
      onImport(loaded.map((file) => ({ ...file, language: file.language || 'javascript' })))
      onClose()
    }

    if (share.files.length > 0) {
      applyFiles(share.files)
      return
    }

    setLoadingShareId(share.id)
    setError('')
    void loadShareById(share.id)
      .then((data) => {
        if (!data?.files.length) {
          setError(t('share.loadFailed'))
          return
        }
        applyFiles(data.files)
      })
      .catch(() => {
        setError(t('share.loadFailed'))
      })
      .finally(() => {
        setLoadingShareId(null)
      })
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
          {intentShareSummary ? (
            <span className="status-pill" data-testid="share-intent-summary">
              {t('share.intent.summary', { summary: intentShareSummary })}
            </span>
          ) : null}
        </div>
      </div>

      <div className="share-tabs">
        {(
          [
            { id: 'progress' as const, label: t('share.tab.progress') },
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
                {hasIntentSpecs ? (
                  <label className="share-intent-toggle" data-testid="share-include-intent">
                    <input
                      type="checkbox"
                      checked={includeIntentSnapshot}
                      onChange={(event) => setIncludeIntentSnapshot(event.target.checked)}
                    />
                    <span>{t('share.intent.include')}</span>
                  </label>
                ) : null}
                <div className="share-actions-row">
                  <button
                    type="button"
                    className="btn btn-primary"
                    data-testid="share-generate-btn"
                    disabled={creating}
                    onClick={handleShare}
                  >
                    <Link2 size={14} className="btn-icon-gap" />
                    {creating ? t('share.generating') : t('share.generateLink')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleExport}>
                    <Download size={14} className="btn-icon-gap" />
                    {t('share.exportJson')}
                  </button>
                </div>
                {error ? <div className="alert-banner alert-banner--error">{error}</div> : null}
              </div>
            ) : (
              <div className="import-stack">
                <p className="share-hint">{t('share.linkReady')}</p>
                {shareCloud ? (
                  <p className="share-hint share-hint--muted" data-testid="share-cloud-hint">
                    {t('share.cloudHint')}
                  </p>
                ) : (
                  <p className="share-hint share-hint--muted" data-testid="share-local-hint">
                    {t('share.localHint')}
                  </p>
                )}
                <div className="share-copy-row">
                  <input
                    type="text"
                    className="form-input"
                    data-testid="share-link-input"
                    value={shareUrl}
                    readOnly
                  />
                  <button type="button" className="btn btn-primary" onClick={handleCopy}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span className="btn-icon-gap">{copied ? t('collab.copied') : t('share.copy')}</span>
                  </button>
                </div>
                {shareId ? (
                  <div className="share-copy-row">
                    <input
                      type="text"
                      className="form-input"
                      data-testid="share-progress-link-input"
                      value={generateShareProgressUrl(shareId)}
                      readOnly
                    />
                    <button type="button" className="btn btn-secondary" onClick={() => void handleCopyProgressLink()}>
                      {copiedProgress ? <Check size={14} /> : <Copy size={14} />}
                      <span className="btn-icon-gap">
                        {copiedProgress ? t('collab.copied') : t('share.progress.copyLink')}
                      </span>
                    </button>
                  </div>
                ) : null}
                <button type="button" className="btn btn-secondary" disabled={creating} onClick={handleShare}>
                  {t('share.regenerate')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="share-history-list">
          {historyLoading ? (
            <div className="modal-surface share-empty" data-testid="share-history-loading">
              <Loader2 size={18} className="spin" aria-hidden />
              <span>{t('share.historyLoading')}</span>
            </div>
          ) : shares.length === 0 ? (
            <div className="modal-surface share-empty">{t('share.empty')}</div>
          ) : (
            shares.map((share) => (
              <div key={share.id} className="modal-surface share-history-item" data-testid="share-history-item">
                <div>
                  <div className="share-history-title">
                    {t('share.historyFiles', { count: getShareFileCount(share) })}
                  </div>
                  <div className="share-history-time">
                    {new Date(share.createdAt).toLocaleString()}
                    {share.cloud ? ` · ${t('share.cloudBadge')}` : ` · ${t('share.localBadge')}`}
                  </div>
                </div>
                <div className="share-history-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={loadingShareId === share.id}
                    onClick={() => handleLoad(share)}
                  >
                    {loadingShareId === share.id ? t('share.loading') : t('share.load')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleDelete(share)}
                    title={t('share.deleteTitle')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
          {error ? <div className="alert-banner alert-banner--error">{error}</div> : null}
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="share-progress-panel" data-testid="share-progress-panel">
          <div className="share-progress-panel__readonly">
            <strong>{t('share.progress.readonlyTitle')}</strong>
            <p>{t('share.progress.readonlyDesc')}</p>
            {intentShareSummary ? <p data-testid="share-progress-intent">{intentShareSummary}</p> : null}
            {shareId ? (
              <div className="share-copy-row">
                <input
                  type="text"
                  className="form-input"
                  value={generateShareProgressUrl(shareId)}
                  readOnly
                />
                <button type="button" className="btn btn-secondary" onClick={() => void handleCopyProgressLink()}>
                  {copiedProgress ? <Check size={14} /> : <Copy size={14} />}
                  <span className="btn-icon-gap">
                    {copiedProgress ? t('collab.copied') : t('share.progress.copyLink')}
                  </span>
                </button>
              </div>
            ) : (
              <p className="share-hint share-hint--muted">{t('share.progress.linkHint')}</p>
            )}
          </div>
          <div>
            <strong>{t('share.progress.proofPreview')}</strong>
            {proofHtmlFiles.length > 0 ? (
              <>
                <select
                  className="share-select"
                  value={proofPreviewPath ?? proofHtmlFiles[proofHtmlFiles.length - 1]?.name ?? ''}
                  onChange={(event) => setProofPreviewPath(event.target.value)}
                >
                  {proofHtmlFiles.map((file) => (
                    <option key={file.name} value={file.name}>
                      {file.name}
                    </option>
                  ))}
                </select>
                <iframe
                  className="proof-preview-frame"
                  title={t('share.progress.proofPreview')}
                  sandbox=""
                  srcDoc={proofPreviewContent}
                />
              </>
            ) : (
              <p>{t('share.progress.noProof')}</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="share-stack">
          <div className="modal-surface">
            <p className="share-hint share-hint--spaced">{t('share.importHint')}</p>
            {isPlanGatedTierCEnabled('intentShareImport') ? (
              <p className="share-hint share-hint--muted" data-testid="share-intent-import-hint">
                {t('share.intent.importHint')}
              </p>
            ) : (
              <UpgradeEntitlementHint
                messageKey="entitlements.upgrade.intentShare"
                onUpgrade={() => useIDEStore.getState().setShowSubscriptionModal(true)}
                compact
              />
            )}
            {intentSharePreview?.ok ? (
              <div className="modal-surface share-intent-preview" data-testid="share-intent-preview">
                <div className="share-intent-preview__title">{t('share.intent.previewTitle')}</div>
                <div className="share-intent-preview__summary">{intentSharePreview.summary}</div>
                <ul className="share-intent-preview__list">
                  {intentSharePreview.snapshot.specs.map((spec) => (
                    <li key={spec.tasksPath}>
                      {spec.slug}: {spec.doneTasks}/{spec.totalTasks}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-testid="share-intent-apply-focus"
                  onClick={handleApplyIntentShare}
                >
                  {t('share.intent.applyFocus')}
                </button>
              </div>
            ) : null}
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
