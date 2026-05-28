import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, GitBranch, History, Plus, RefreshCw, RotateCcw } from 'lucide-react'
import * as gitService from '../services/gitService'
import type { GitFileSyncUpdate } from '../services/gitService'
import type { FileItem } from '../types/file'
import { useI18n } from '../i18n'
import { workspaceContextService } from '../services/workspaceContextService'
import styles from './GitPanel.module.css'

interface GitPanelProps {
  fs: any
  files: FileItem[]
  onFilesChange: () => void
  onEditorSync?: (updates: GitFileSyncUpdate[]) => void
  onShowDiff?: (oldContent: string, newContent: string) => void
  notify?: (kind: 'success' | 'error' | 'info', title: string, detail?: string) => void
}

const GitPanel: React.FC<GitPanelProps> = ({ fs, files, onFilesChange, onEditorSync, onShowDiff, notify }) => {
  const { t } = useI18n()
  const [status, setStatus] = useState<gitService.GitStatus[]>([])
  const [commits, setCommits] = useState<gitService.GitCommit[]>([])
  const [commitMessage, setCommitMessage] = useState('')
  const [isInit, setIsInit] = useState(false)
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branch, setBranch] = useState<string | null>(null)
  const [branches, setBranches] = useState<string[]>([])

  const syncWorkspaceToFs = useCallback(async () => {
    if (!fs) return
    for (const file of files) {
      await fs.writeFile(file.name, file.content)
    }
  }, [files, fs])

  const refresh = useCallback(async () => {
    if (!fs) return
    try {
      await syncWorkspaceToFs()
      const nextStatus = await gitService.getStatus(fs, '/')
      const nextLog = await gitService.getLog(fs, '/')
      const nextBranch = await gitService.getCurrentBranch(fs, '/')
      const nextBranches = await gitService.listBranches(fs, '/')
      setStatus(nextStatus)
      setCommits(nextLog)
      setBranch(nextBranch)
      setBranches(nextBranches)
      setIsInit(true)
      setError(null)
    } catch (refreshError) {
      setIsInit(false)
      setError(refreshError instanceof Error ? refreshError.message : t('git.statusReadFailed'))
    }
  }, [fs, syncWorkspaceToFs])

  useEffect(() => {
    refresh()
  }, [refresh, files])

  const runGitAction = async (action: () => Promise<void>) => {
    if (!fs || isBusy) return
    setIsBusy(true)
    try {
      setError(null)
      await action()
      await refresh()
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : t('git.actionFailed')
      setError(message)
      notify?.('error', t('git.actionFailed'), message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleInit = () => runGitAction(async () => {
    await gitService.initRepo(fs, '/')
  })

  const handleStage = (filepath: string) => runGitAction(async () => {
    await gitService.addFile(fs, '/', filepath)
    notify?.('success', t('git.stagedFile'), filepath)
  })

  const handleCommit = () => runGitAction(async () => {
    if (!commitMessage.trim()) return
    await gitService.commit(fs, '/', commitMessage.trim())
    notify?.('success', t('git.commitDone'), commitMessage.trim())
    setCommitMessage('')
    onFilesChange()
  })

  const handleStageAll = () => runGitAction(async () => {
    for (const file of status.filter((item) => !item.staged)) {
      await gitService.addFile(fs, '/', file.filepath)
    }
    notify?.('success', t('git.stagedAll'), t('git.stagedAllDetail', { count: unstaged.length }))
  })

  const handleUnstage = (filepath: string) => runGitAction(async () => {
    await gitService.unstageFile(fs, '/', filepath)
    notify?.('success', t('git.unstaged'), filepath)
  })

  const handleShowDiff = async (filepath: string) => {
    if (!fs || isBusy) return
    try {
      await syncWorkspaceToFs()
      const diff = await gitService.getFileDiff(fs, '/', filepath)
      onShowDiff?.(diff.oldContent, diff.newContent)
    } catch (diffError) {
      const message = diffError instanceof Error ? diffError.message : t('git.diffReadFailed')
      setError(message)
      notify?.('error', t('git.diffViewFailed'), message)
    }
  }

  const handleDiscard = (item: gitService.GitStatus) => runGitAction(async () => {
    const content = await gitService.discardFileChanges(fs, '/', item.filepath, item.status)
    onEditorSync?.([{ path: item.filepath, content }])
    notify?.('success', t('git.discarded'), item.filepath)
  })

  const handleDiscardAllUnstaged = () => runGitAction(async () => {
    const updates = await gitService.discardAllUnstaged(fs, '/', status)
    onEditorSync?.(updates)
    notify?.('success', t('git.discardedAll'), t('git.discardedAllDetail', { count: updates.length }))
  })

  const handleCheckoutBranch = (nextBranch: string) => runGitAction(async () => {
    if (!nextBranch || nextBranch === branch) return
    await gitService.checkoutBranch(fs, '/', nextBranch)

    const paths = [
      ...new Set([
        ...files.map((file) => file.name),
        ...workspaceContextService.getAllFiles().map((file) => file.path),
      ]),
    ]
    const updates = await gitService.readWorktreeContents(fs, '/', paths)
    onEditorSync?.(updates)

    notify?.('success', t('git.branchSwitched'), nextBranch)
    onFilesChange()
  })

  const staged = useMemo(() => status.filter((item) => item.staged), [status])
  const unstaged = useMemo(() => status.filter((item) => !item.staged), [status])

  const badgeForStatus = (fileStatus: gitService.GitStatus['status']) => {
    switch (fileStatus) {
      case 'added':
        return { label: 'A', color: '#33c58e' }
      case 'deleted':
        return { label: 'D', color: '#ff6b81' }
      case 'modified':
        return { label: 'M', color: '#ffb648' }
      default:
        return { label: '?', color: 'var(--text-secondary)' }
    }
  }

  if (!fs) {
    return (
      <div className={styles.waitRuntime}>
        {t('git.waitRuntime')}
      </div>
    )
  }

  if (!isInit) {
    return (
      <div className={styles.notInitContainer}>
        <div className={styles.notInitCard}>
          <div className={styles.notInitTitle}>{t('git.notInit.title')}</div>
          <div className={styles.notInitDesc}>{t('git.notInit.desc')}</div>
          {error && <div className={styles.notInitError}>{error}</div>}
        </div>
        <button className="btn btn-primary" onClick={handleInit} disabled={isBusy}>
          <GitBranch size={14} className={styles.initButtonIcon} />
          {isBusy ? t('git.initBusy') : t('git.initRepo')}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.branchSelector}>
          <GitBranch size={14} className={styles.branchIcon} />
          <select
            value={branch ?? 'main'}
            onChange={(event) => void handleCheckoutBranch(event.target.value)}
            disabled={isBusy}
            className={styles.branchSelect}
          >
            {(branches.length > 0 ? branches : [branch ?? 'main']).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={`btn btn-secondary ${styles.refreshButton}`}
          onClick={() => void refresh()}
          disabled={isBusy}
          title={t('git.refreshTitle')}
        >
          <RefreshCw size={12} className={styles.refreshIcon} />
          {t('git.refresh')}
        </button>
      </div>

      <div className={styles.tabs}>
        {[
          { id: 'changes' as const, icon: History, label: t('git.tab.changes', { count: status.length }) },
          { id: 'history' as const, icon: History, label: t('git.tab.history', { count: commits.length }) },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'changes' && (
        <div className={styles.content}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {unstaged.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionLabel}>{t('git.unstagedLabel')}</div>
                  <div className={styles.sectionCount}>{t('git.unstagedCount', { count: unstaged.length })}</div>
                </div>
                <div className={styles.sectionActions}>
                  <button type="button" className="btn btn-secondary" onClick={handleDiscardAllUnstaged} disabled={isBusy}>
                    {t('git.discardAll')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleStageAll} disabled={isBusy}>
                    {t('git.stageAll')}
                  </button>
                </div>
              </div>

              <div className={styles.fileList}>
                {unstaged.map((item) => {
                  const badge = badgeForStatus(item.status)
                  return (
                    <div key={item.filepath} className={styles.fileItem}>
                      <span className={styles.fileBadge} style={{ color: badge.color }}>
                        {badge.label}
                      </span>
                      <span className={styles.fileName}>{item.filepath}</span>
                      <button
                        type="button"
                        className={`btn btn-secondary ${styles.fileButton}`}
                        disabled={isBusy}
                        onClick={() => handleShowDiff(item.filepath)}
                      >
                        {t('git.diff')}
                      </button>
                      <button
                        type="button"
                        className={`btn btn-secondary ${styles.fileButton}`}
                        disabled={isBusy}
                        onClick={() => handleDiscard(item)}
                        title={t('git.discardFileTitle')}
                      >
                        <RotateCcw size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStage(item.filepath)}
                        className={styles.fileIconButton}
                        title={t('git.stageTitle')}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {staged.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionLabel}>{t('git.stagedLabel')}</div>
              <div className={styles.fileList} style={{ marginBottom: '12px' }}>
                {staged.map((item) => (
                  <div key={item.filepath} className={styles.stagedFileItem}>
                    <Check size={14} className={styles.stagedCheckIcon} />
                    <span className={styles.stagedFileName}>{item.filepath}</span>
                    <button className={`btn btn-secondary ${styles.fileButton}`} onClick={() => handleUnstage(item.filepath)} disabled={isBusy}>
                      {t('git.unstage')}
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.commitSection}>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleCommit()}
                  placeholder={t('git.commitPlaceholder')}
                  className={styles.commitInput}
                />
                <button className="btn btn-primary" onClick={handleCommit} disabled={!commitMessage.trim() || isBusy}>
                  {isBusy ? t('git.committing') : t('git.commit')}
                </button>
              </div>
            </section>
          )}

          {status.length === 0 && (
            <div className={styles.emptyState}>
              {t('git.noChanges')}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className={styles.content}>
          {commits.map((commit) => (
            <div key={commit.oid} className={styles.commitItem}>
              <div className={styles.commitMessage}>{commit.commit.message}</div>
              <div className={styles.commitMeta}>
                {commit.commit.author.name} · {new Date(commit.commit.author.timestamp * 1000).toLocaleString()}
              </div>
              <div className={styles.commitOid}>{commit.oid.slice(0, 7)}</div>
            </div>
          ))}

          {commits.length === 0 && (
            <div className={styles.emptyState}>
              {t('git.noCommits')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GitPanel
