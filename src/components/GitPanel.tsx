import React, { useState, useEffect, useCallback } from 'react'
import { Plus, GitBranch, History, Check } from 'lucide-react'
import * as gitService from '../services/gitService'

interface GitPanelProps {
  fs: any
  files: string[]
  onFilesChange: () => void
}

const GitPanel: React.FC<GitPanelProps> = ({ fs, files, onFilesChange }) => {
  const [status, setStatus] = useState<gitService.GitStatus[]>([])
  const [commits, setCommits] = useState<gitService.GitCommit[]>([])
  const [commitMessage, setCommitMessage] = useState('')
  const [isInit, setIsInit] = useState(false)
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes')

  const refresh = useCallback(async () => {
    if (!fs) return
    try {
      const s = await gitService.getStatus(fs, '/')
      setStatus(s)
      const log = await gitService.getLog(fs, '/')
      setCommits(log)
      setIsInit(true)
    } catch {
      setIsInit(false)
    }
  }, [fs])

  useEffect(() => {
    refresh()
  }, [refresh, files])

  const handleInit = async () => {
    await gitService.initRepo(fs, '/')
    await refresh()
  }

  const handleStage = async (filepath: string) => {
    if (!fs) return
    await gitService.addFile(fs, '/', filepath)
    await refresh()
  }

  const handleCommit = async () => {
    if (!commitMessage.trim() || !fs) return
    await gitService.commit(fs, '/', commitMessage.trim())
    setCommitMessage('')
    await refresh()
    onFilesChange()
  }

  const handleStageAll = async () => {
    for (const file of status.filter(s => !s.staged)) {
      await gitService.addFile(fs, '/', file.filepath)
    }
    await refresh()
  }

  if (!isInit) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          未初始化 Git 仓库
        </p>
        <button className="btn btn-primary" onClick={handleInit}>
          <GitBranch size={14} style={{ marginRight: '6px' }} />
          初始化仓库
        </button>
      </div>
    )
  }

  const staged = status.filter(s => s.staged)
  const unstaged = status.filter(s => !s.staged)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: '4px', padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
        {[
          { id: 'changes', icon: Plus, label: `更改 (${status.length})` },
          { id: 'history', icon: History, label: `历史 (${commits.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '6px',
              fontSize: '12px',
              background: activeTab === tab.id ? 'var(--bg-tertiary)' : 'transparent',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'changes' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {unstaged.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  未暂存 ({unstaged.length})
                </span>
                <button
                  onClick={handleStageAll}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    background: 'var(--bg-tertiary)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  全部暂存
                </button>
              </div>
              {unstaged.map((s) => (
                <div
                  key={s.filepath}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleStage(s.filepath)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      color: s.status === 'added' ? '#3fb950' : s.status === 'deleted' ? '#f85149' : '#d29922'
                    }}>
                      {s.status === 'added' ? 'A' : s.status === 'modified' ? 'M' : s.status === 'deleted' ? 'D' : '?'}
                    </span>
                    {s.filepath}
                  </span>
                  <Plus size={12} />
                </div>
              ))}
            </>
          )}

          {staged.length > 0 && (
            <>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '12px 0 8px' }}>
                已暂存 ({staged.length})
              </div>
              {staged.map((s) => (
                <div
                  key={s.filepath}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Check size={12} style={{ color: '#3fb950' }} />
                  {s.filepath}
                </div>
              ))}
            </>
          )}

          {staged.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
                placeholder="提交信息"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  marginBottom: '8px',
                  fontSize: '13px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                className="btn btn-primary"
                onClick={handleCommit}
                disabled={!commitMessage.trim()}
                style={{ width: '100%' }}
              >
                提交
              </button>
            </div>
          )}

          {status.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px', fontSize: '13px' }}>
              没有更改
            </p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {commits.map((commit) => (
            <div
              key={commit.oid}
              style={{
                padding: '8px',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '12px'
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                {commit.commit.message}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                {commit.commit.author.name} · {new Date(commit.commit.author.timestamp * 1000).toLocaleString()}
              </div>
              <div style={{ color: 'var(--accent-color)', fontSize: '10px', marginTop: '4px' }}>
                {commit.oid.slice(0, 7)}
              </div>
            </div>
          ))}
          {commits.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
              暂无提交记录
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default GitPanel
