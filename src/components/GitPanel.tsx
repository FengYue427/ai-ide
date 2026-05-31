import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  GitBranch,
  GitCompare,
  History,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
} from 'lucide-react'
import * as gitService from '../services/gitService'
import type { GitCommitFileChange, GitFileSyncUpdate } from '../services/gitService'
import type { FileItem } from '../types/file'
import { getLanguageFromExt } from '../app/getLanguageFromExt'
import { formatGitRelativeTime } from '../lib/formatGitRelativeTime'
import { getLogContinueRef, gitLogHasMore, mergeGitLogPages } from '../lib/gitLogPagination'
import { isValidBranchName } from '../lib/isValidBranchName'
import { shouldShowGitStatusPerfHint } from '../lib/gitStatusPerfHint'
import { useI18n } from '../i18n'
import { InlineStatePanel } from './InlineStatePanel'
import { workspaceContextService } from '../services/workspaceContextService'
import styles from './GitPanel.module.css'

interface GitPanelProps {
  fs: any
  files: FileItem[]
  onFilesChange: () => void
  onEditorSync?: (updates: GitFileSyncUpdate[]) => void
  onOpenGitDiffTab?: (payload: {
    path: string
    diffSource?: 'workdir' | 'staged' | 'commit'
    commitOid?: string
    oldContent: string
    newContent: string
    language: string
  }) => void
  readOnly?: boolean
  notify?: (kind: 'success' | 'error' | 'info', title: string, detail?: string) => void
}

const GitPanel: React.FC<GitPanelProps> = ({
  fs,
  files,
  onFilesChange,
  onEditorSync,
  onOpenGitDiffTab,
  readOnly = false,
  notify,
}) => {
  const { t, locale } = useI18n()
  const [status, setStatus] = useState<gitService.GitStatus[]>([])
  const [commits, setCommits] = useState<gitService.GitCommit[]>([])
  const [commitMessage, setCommitMessage] = useState('')
  const [isInit, setIsInit] = useState(false)
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branch, setBranch] = useState<string | null>(null)
  const [branches, setBranches] = useState<string[]>([])
  const [newBranchName, setNewBranchName] = useState('')
  const [showNewBranchForm, setShowNewBranchForm] = useState(false)
  const [expandedCommitOid, setExpandedCommitOid] = useState<string | null>(null)
  const [commitFilesByOid, setCommitFilesByOid] = useState<Record<string, GitCommitFileChange[]>>({})
  const [commitFilesLoadingOid, setCommitFilesLoadingOid] = useState<string | null>(null)
  const [historyHasMore, setHistoryHasMore] = useState(false)
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false)

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
      setHistoryHasMore(gitLogHasMore(nextLog))
      setBranch(nextBranch)
      setBranches(nextBranches)
      setIsInit(true)
      setError(null)
    } catch (refreshError) {
      setIsInit(false)
      setError(refreshError instanceof Error ? refreshError.message : t('git.statusReadFailed'))
    }
  }, [fs, syncWorkspaceToFs, t])

  const loadMoreHistory = useCallback(async () => {
    if (!fs || historyLoadingMore || !historyHasMore) return
    const continueRef = getLogContinueRef(commits)
    if (!continueRef) {
      setHistoryHasMore(false)
      return
    }

    setHistoryLoadingMore(true)
    try {
      const nextPage = await gitService.getLog(fs, '/', { ref: continueRef })
      const merged = mergeGitLogPages(commits, nextPage)
      setCommits(merged)
      setHistoryHasMore(gitLogHasMore(merged))
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : t('git.historyLoadFailed')
      notify?.('error', t('git.historyLoadFailed'), message)
      setHistoryHasMore(false)
    } finally {
      setHistoryLoadingMore(false)
    }
  }, [commits, fs, historyHasMore, historyLoadingMore, notify, t])

  useEffect(() => {
    refresh()
  }, [refresh, files])

  const runGitAction = async (action: () => Promise<void>) => {
    if (!fs || isBusy || readOnly) return
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

  const openDiffTab = async (
    filepath: string,
    diffSource: 'workdir' | 'staged' | 'commit',
    loadDiff: () => Promise<{ oldContent: string; newContent: string }>,
    commitOid?: string,
  ) => {
    if (!fs || isBusy) return
    try {
      if (diffSource !== 'commit') {
        await syncWorkspaceToFs()
      }
      const diff = await loadDiff()
      onOpenGitDiffTab?.({
        path: filepath,
        diffSource,
        commitOid,
        oldContent: diff.oldContent,
        newContent: diff.newContent,
        language: getLanguageFromExt(filepath),
      })
    } catch (diffError) {
      const message = diffError instanceof Error ? diffError.message : t('git.diffReadFailed')
      setError(message)
      notify?.('error', t('git.diffViewFailed'), message)
    }
  }

  const handleShowWorkdirDiff = (filepath: string) =>
    openDiffTab(filepath, 'workdir', () => gitService.getFileDiff(fs, '/', filepath))

  const handleShowStagedDiff = (filepath: string) =>
    openDiffTab(filepath, 'staged', () => gitService.getStagedDiff(fs, '/', filepath))

  const handleShowCommitDiff = (commitOid: string, filepath: string) =>
    openDiffTab(
      filepath,
      'commit',
      () => gitService.getCommitFileDiff(fs, '/', commitOid, filepath),
      commitOid,
    )

  const toggleCommitExpand = async (commitOid: string) => {
    if (expandedCommitOid === commitOid) {
      setExpandedCommitOid(null)
      return
    }

    setExpandedCommitOid(commitOid)
    if (commitFilesByOid[commitOid] || !fs) return

    setCommitFilesLoadingOid(commitOid)
    try {
      const changedFiles = await gitService.getCommitChangedFiles(fs, '/', commitOid)
      setCommitFilesByOid((prev) => ({ ...prev, [commitOid]: changedFiles }))
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : t('git.commitFilesFailed')
      notify?.('error', t('git.commitFilesFailed'), message)
    } finally {
      setCommitFilesLoadingOid(null)
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

  const handleCreateBranch = () => runGitAction(async () => {
    const name = newBranchName.trim()
    if (!name) {
      notify?.('info', t('git.branchNameRequired'))
      return
    }
    if (!isValidBranchName(name)) {
      throw new Error(t('git.branchNameInvalid'))
    }
    if (branches.includes(name)) {
      throw new Error(t('git.branchExists'))
    }

    await gitService.createBranch(fs, '/', name, true)
    setNewBranchName('')
    setShowNewBranchForm(false)
    notify?.('success', t('git.branchCreated'), name)
    onFilesChange()
  })

  const staged = useMemo(() => status.filter((item) => item.staged), [status])
  const unstaged = useMemo(() => status.filter((item) => !item.staged), [status])

  const badgeForCommitChange = (changeStatus: GitCommitFileChange['status']) => {
    switch (changeStatus) {
      case 'added':
        return { label: 'A', color: '#33c58e' }
      case 'deleted':
        return { label: 'D', color: '#ff6b81' }
      default:
        return { label: 'M', color: '#ffb648' }
    }
  }

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
      <div className={styles.stateContainer}>
        <InlineStatePanel
          compact
          tone="hint"
          icon={GitBranch}
          title={t('git.waitRuntimeTitle')}
          description={t('git.waitRuntime')}
        />
      </div>
    )
  }

  if (!isInit) {
    return (
      <div className={styles.stateContainer}>
        <InlineStatePanel
          tone="empty"
          icon={GitBranch}
          title={t('git.notInit.title')}
          description={error ?? t('git.notInit.desc')}
          primaryAction={
            readOnly
              ? undefined
              : {
                  label: isBusy ? t('git.initBusy') : t('git.initRepo'),
                  onClick: handleInit,
                }
          }
        />
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      {readOnly ? (
        <div className={styles.readOnlyBanner} role="status">
          {t('git.readOnlyBanner')}
        </div>
      ) : null}

      <div className={styles.header}>
        <div className={styles.branchBlock}>
          <div className={styles.branchSelector}>
            <GitBranch size={14} className={styles.branchIcon} />
            <select
              value={branch ?? 'main'}
              onChange={(event) => handleCheckoutBranch(event.target.value)}
              disabled={isBusy || readOnly}
              className={styles.branchSelect}
            >
              {(branches.length > 0 ? branches : [branch ?? 'main']).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {!readOnly ? (
              <button
                type="button"
                className={styles.newBranchToggle}
                onClick={() => setShowNewBranchForm((prev) => !prev)}
                disabled={isBusy}
                title={t('git.createBranchTitle')}
                aria-expanded={showNewBranchForm}
              >
                <Plus size={14} />
              </button>
            ) : null}
          </div>
          {showNewBranchForm && !readOnly ? (
            <div className={styles.newBranchForm}>
              <input
                type="text"
                value={newBranchName}
                onChange={(event) => setNewBranchName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && void handleCreateBranch()}
                placeholder={t('git.newBranchPlaceholder')}
                className={styles.newBranchInput}
                disabled={isBusy}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleCreateBranch()}
                disabled={isBusy || !newBranchName.trim()}
              >
                {t('git.createBranch')}
              </button>
            </div>
          ) : null}
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

          {shouldShowGitStatusPerfHint(status.length) ? (
            <InlineStatePanel
              compact
              tone="hint"
              title={t('git.statusPerfHintTitle')}
              description={t('git.statusPerfHintDesc', { count: status.length })}
              tips={[t('git.statusPerfHintTip')]}
            />
          ) : null}

          {staged.length > 0 && (
            <section className={`${styles.section} ${styles.sectionStaged}`}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionLabel}>{t('git.stagedLabel')}</div>
                  <div className={styles.sectionCount}>{t('git.stagedCount', { count: staged.length })}</div>
                </div>
              </div>

              <div className={styles.fileList}>
                {staged.map((item) => {
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
                        onClick={() => handleShowStagedDiff(item.filepath)}
                        title={t('git.stagedDiffTitle')}
                      >
                        <GitCompare size={12} />
                        {t('git.stagedDiff')}
                      </button>
                      <button
                        type="button"
                        className={`btn btn-secondary ${styles.fileButton}`}
                        disabled={isBusy || readOnly}
                        onClick={() => handleUnstage(item.filepath)}
                      >
                        <Minus size={12} />
                        {t('git.unstage')}
                      </button>
                    </div>
                  )
                })}
              </div>

              {!readOnly ? (
                <div className={styles.commitSection}>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(event) => setCommitMessage(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleCommit()}
                    placeholder={t('git.commitPlaceholder')}
                    className={styles.commitInput}
                    disabled={isBusy}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleCommit}
                    disabled={!commitMessage.trim() || isBusy}
                  >
                    {isBusy ? t('git.committing') : t('git.commit')}
                  </button>
                </div>
              ) : null}
            </section>
          )}

          {unstaged.length > 0 && (
            <section className={`${styles.section} ${styles.sectionChanges}`}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionLabel}>{t('git.changesLabel')}</div>
                  <div className={styles.sectionCount}>{t('git.unstagedCount', { count: unstaged.length })}</div>
                </div>
                {!readOnly ? (
                  <div className={styles.sectionActions}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleDiscardAllUnstaged}
                      disabled={isBusy}
                    >
                      {t('git.discardAll')}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleStageAll} disabled={isBusy}>
                      {t('git.stageAll')}
                    </button>
                  </div>
                ) : null}
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
                        onClick={() => handleShowWorkdirDiff(item.filepath)}
                      >
                        {t('git.diff')}
                      </button>
                      {!readOnly ? (
                        <>
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
                        </>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {status.length === 0 && (
            <InlineStatePanel
              compact
              tone="empty"
              icon={History}
              title={t('git.noChangesTitle')}
              description={t('git.noChanges')}
            />
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className={styles.content}>
          {commits.map((commit) => {
            const oid = commit.oid
            const isExpanded = expandedCommitOid === oid
            const changedFiles = commitFilesByOid[oid]
            const isLoadingFiles = commitFilesLoadingOid === oid

            return (
              <div key={oid} className={`${styles.commitItem} ${isExpanded ? styles.commitItemExpanded : ''}`}>
                <button
                  type="button"
                  className={styles.commitHeader}
                  onClick={() => void toggleCommitExpand(oid)}
                  aria-expanded={isExpanded}
                >
                  <span className={styles.commitExpandIcon}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  <div className={styles.commitHeaderMain}>
                    <div className={styles.commitMessage}>{commit.commit.message.trim() || t('git.emptyCommitMessage')}</div>
                    <div className={styles.commitMeta}>
                      <span>{commit.commit.author.name}</span>
                      <span>·</span>
                      <span title={new Date(commit.commit.author.timestamp * 1000).toLocaleString()}>
                        {formatGitRelativeTime(commit.commit.author.timestamp, locale)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.commitOid}>{oid.slice(0, 7)}</div>
                </button>

                {isExpanded ? (
                  <div className={styles.commitFilesPanel}>
                    {isLoadingFiles ? (
                      <div className={styles.commitFilesLoading}>{t('git.commitFilesLoading')}</div>
                    ) : changedFiles && changedFiles.length > 0 ? (
                      <div className={styles.fileList}>
                        {changedFiles.map((item) => {
                          const badge = badgeForCommitChange(item.status)
                          return (
                            <div key={`${oid}:${item.filepath}`} className={styles.fileItem}>
                              <span className={styles.fileBadge} style={{ color: badge.color }}>
                                {badge.label}
                              </span>
                              <span className={styles.fileName}>{item.filepath}</span>
                              <button
                                type="button"
                                className={`btn btn-secondary ${styles.fileButton}`}
                                disabled={isBusy}
                                onClick={() => handleShowCommitDiff(oid, item.filepath)}
                                title={t('git.commitDiffTitle', { sha: oid.slice(0, 7) })}
                              >
                                <GitCompare size={12} />
                                {t('git.diff')}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className={styles.commitFilesEmpty}>{t('git.commitFilesEmpty')}</div>
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}

          {historyHasMore ? (
            <div className={styles.historyLoadMore}>
              <button
                type="button"
                className={`btn btn-secondary ${styles.historyLoadMoreButton}`}
                disabled={isBusy || historyLoadingMore}
                onClick={() => void loadMoreHistory()}
              >
                {historyLoadingMore ? t('git.historyLoadingMore') : t('git.historyLoadMore')}
              </button>
            </div>
          ) : null}

          {commits.length === 0 && (
            <InlineStatePanel
              compact
              tone="empty"
              icon={History}
              title={t('git.noCommitsTitle')}
              description={t('git.noCommits')}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default GitPanel
