import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, GitBranch, History, Plus, RefreshCw, RotateCcw } from 'lucide-react'
import * as gitService from '../services/gitService'
import type { GitFileSyncUpdate } from '../services/gitService'
import type { FileItem } from '../types/file'
import { useI18n } from '../i18n'
import { workspaceContextService } from '../services/workspaceContextService'

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
      <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7 }}>
        {t('git.waitRuntime')}
      </div>
    )
  }

  if (!isInit) {
    return (
      <div style={{ padding: '16px', display: 'grid', gap: '14px' }}>
        <div style={{ padding: '18px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'color-mix(in srgb, var(--bg-secondary) 88%, transparent)' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{t('git.notInit.title')}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('git.notInit.desc')}</div>
          {error && <div style={{ marginTop: '10px', color: 'var(--danger-color)', fontSize: '12px' }}>{error}</div>}
        </div>
        <button className="btn btn-primary" onClick={handleInit} disabled={isBusy}>
          <GitBranch size={14} style={{ marginRight: '6px' }} />
          {isBusy ? t('git.initBusy') : t('git.initRepo')}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '10px 12px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <GitBranch size={14} color="var(--text-secondary)" />
          <select
            value={branch ?? 'main'}
            onChange={(event) => void handleCheckoutBranch(event.target.value)}
            disabled={isBusy}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 700,
            }}
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
          className="btn btn-secondary"
          onClick={() => void refresh()}
          disabled={isBusy}
          style={{ padding: '6px 10px', fontSize: '11px' }}
          title={t('git.refreshTitle')}
        >
          <RefreshCw size={12} style={{ marginRight: '4px' }} />
          {t('git.refresh')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
        {[
          { id: 'changes' as const, icon: Plus, label: t('git.tab.changes', { count: status.length }) },
          { id: 'history' as const, icon: History, label: t('git.tab.history', { count: commits.length }) },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '12px',
              border: `1px solid ${activeTab === tab.id ? 'color-mix(in srgb, var(--accent-color) 34%, var(--border-color))' : 'var(--border-color)'}`,
              background: activeTab === tab.id ? 'color-mix(in srgb, var(--accent-color) 10%, transparent)' : 'var(--bg-primary)',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'changes' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '12px', display: 'grid', gap: '14px' }}>
          {error && (
            <div style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid color-mix(in srgb, var(--danger-color) 42%, var(--border-color))', color: 'var(--danger-color)', fontSize: '12px' }}>
              {error}
            </div>
          )}

          {unstaged.length > 0 && (
            <section style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>{t('git.unstagedLabel')}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{t('git.unstagedCount', { count: unstaged.length })}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleDiscardAllUnstaged} disabled={isBusy}>
                    {t('git.discardAll')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleStageAll} disabled={isBusy}>
                    {t('git.stageAll')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                {unstaged.map((item) => {
                  const badge = badgeForStatus(item.status)
                  return (
                    <div
                      key={item.filepath}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '28px 1fr auto auto auto',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.filepath}</span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={isBusy}
                        onClick={() => handleShowDiff(item.filepath)}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        {t('git.diff')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={isBusy}
                        onClick={() => handleDiscard(item)}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        title={t('git.discardFileTitle')}
                      >
                        <RotateCcw size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStage(item.filepath)}
                        style={{ background: 'none', border: 'none', cursor: isBusy ? 'wait' : 'pointer', padding: 0 }}
                        title={t('git.stageTitle')}
                      >
                        <Plus size={14} color="var(--text-secondary)" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {staged.length > 0 && (
            <section style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '10px' }}>{t('git.stagedLabel')}</div>
              <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
                {staged.map((item) => (
                  <div key={item.filepath} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <Check size={14} color="#33c58e" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.filepath}</span>
                    <button className="btn btn-secondary" onClick={() => handleUnstage(item.filepath)} disabled={isBusy} style={{ padding: '4px 8px', fontSize: '11px' }}>
                      {t('git.unstage')}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleCommit()}
                  placeholder={t('git.commitPlaceholder')}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                />
                <button className="btn btn-primary" onClick={handleCommit} disabled={!commitMessage.trim() || isBusy}>
                  {isBusy ? t('git.committing') : t('git.commit')}
                </button>
              </div>
            </section>
          )}

          {status.length === 0 && (
            <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('git.noChanges')}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '12px', display: 'grid', gap: '10px' }}>
          {commits.map((commit) => (
            <div key={commit.oid} style={{ padding: '14px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>{commit.commit.message}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>
                {commit.commit.author.name} · {new Date(commit.commit.author.timestamp * 1000).toLocaleString()}
              </div>
              <div style={{ color: 'var(--accent-color)', fontSize: '11px', fontWeight: 700 }}>{commit.oid.slice(0, 7)}</div>
            </div>
          ))}

          {commits.length === 0 && (
            <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('git.noCommits')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GitPanel
