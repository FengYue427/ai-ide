import React, { useState } from 'react'
import { X, Github, Upload, Link2, FolderOpen, FileArchive } from 'lucide-react'
import JSZip from 'jszip'
import { parseGitHubUrl, fetchRepoContents, getRepoBranches } from '../services/githubService'

interface ImportModalProps {
  onImport: (files: { name: string; content: string; language: string }[]) => void
  onClose: () => void
}

const ImportModal: React.FC<ImportModalProps> = ({ onImport, onClose }) => {
  const [activeTab, setActiveTab] = useState<'github' | 'upload' | 'zip'>('github')
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [branches, setBranches] = useState<string[]>([])
  const [selectedBranch, setSelectedBranch] = useState('main')
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string } | null>(null)

  const handleParseUrl = async () => {
    const info = parseGitHubUrl(url)
    if (!info) {
      setError('无效的 GitHub URL')
      return
    }
    setRepoInfo({ owner: info.owner, repo: info.repo })
    setError('')
    
    // Fetch branches
    const branchList = await getRepoBranches(info.owner, info.repo, token || undefined)
    setBranches(branchList)
    setSelectedBranch(info.branch || branchList[0] || 'main')
  }

  const handleImport = async () => {
    if (!repoInfo) return
    setLoading(true)
    setError('')

    const result = await fetchRepoContents(
      repoInfo.owner,
      repoInfo.repo,
      '',
      selectedBranch,
      token || undefined
    )

    if (result.error) {
      setError(result.error)
    } else if (result.files.length === 0) {
      setError('未找到可导入的文件')
    } else {
      const files = result.files.map(f => {
        const ext = f.path.split('.').pop()?.toLowerCase() || ''
        const langMap: Record<string, string> = {
          js: 'javascript', ts: 'typescript', jsx: 'javascript',
          tsx: 'typescript', py: 'python', html: 'html',
          css: 'css', json: 'json', md: 'markdown', vue: 'html'
        }
        return {
          name: f.path,
          content: f.content,
          language: langMap[ext] || 'plaintext'
        }
      })
      onImport(files)
    }

    setLoading(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return

    const files: { name: string; content: string; language: string }[] = []
    let processed = 0

    Array.from(fileList).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string || ''
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        const langMap: Record<string, string> = {
          js: 'javascript', ts: 'typescript', jsx: 'javascript',
          tsx: 'typescript', py: 'python', html: 'html',
          css: 'css', json: 'json', md: 'markdown'
        }
        files.push({
          name: file.name,
          content,
          language: langMap[ext] || 'plaintext'
        })
        processed++
        if (processed === fileList.length) {
          onImport(files)
        }
      }
      reader.readAsText(file)
    })
  }

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.zip')) {
      setError('请选择 ZIP 文件')
      return
    }

    setLoading(true)
    setError('')

    try {
      const zip = new JSZip()
      const arrayBuffer = await file.arrayBuffer()
      const loadedZip = await zip.loadAsync(arrayBuffer)

      const files: { name: string; content: string; language: string }[] = []
      const langMap: Record<string, string> = {
        js: 'javascript', ts: 'typescript', jsx: 'javascript',
        tsx: 'typescript', py: 'python', html: 'html',
        css: 'css', json: 'json', md: 'markdown'
      }

      // 遍历 ZIP 中的所有文件
      const filePromises: Promise<void>[] = []
      loadedZip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          const promise = zipEntry.async('string').then(content => {
            const ext = zipEntry.name.split('.').pop()?.toLowerCase() || ''
            files.push({
              name: zipEntry.name,
              content,
              language: langMap[ext] || 'plaintext'
            })
          })
          filePromises.push(promise)
        }
      })

      await Promise.all(filePromises)

      if (files.length === 0) {
        setError('ZIP 中未找到可导入的文件')
      } else {
        onImport(files)
      }
    } catch (err) {
      setError('解析 ZIP 文件失败: ' + (err as Error).message)
    }

    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={18} />
            导入项目
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
            {[
              { id: 'github', icon: Github, label: 'GitHub' },
              { id: 'upload', icon: Upload, label: '上传文件' },
              { id: 'zip', icon: FileArchive, label: 'ZIP 导入' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setError(''); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  fontSize: '13px',
                  background: activeTab === tab.id ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                  color: activeTab === tab.id ? 'var(--bg-primary)' : 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'github' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">GitHub 仓库 URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
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
                    onClick={handleParseUrl}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px' }}
                  >
                    <Link2 size={14} />
                  </button>
                </div>
              </div>

              {branches.length > 0 && (
                <div className="form-group">
                  <label className="form-label">分支</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">GitHub Token (可选，用于私有仓库)</label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {error && (
                <div style={{ padding: '8px 12px', background: 'rgba(248, 81, 73, 0.1)', borderRadius: '6px', color: '#f85149', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={!repoInfo || loading}
                style={{ marginTop: '8px' }}
              >
                {loading ? '导入中...' : '导入'}
              </button>
            </div>
          )}

          {activeTab === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '20px' }}>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                id="file-upload"
                style={{ display: 'none' }}
              />
              <label
                htmlFor="file-upload"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '32px 48px',
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const droppedFiles = e.dataTransfer.files
                  const fakeEvent = { target: { files: droppedFiles } } as React.ChangeEvent<HTMLInputElement>
                  handleFileUpload(fakeEvent)
                }}
              >
                <Upload size={32} style={{ color: 'var(--accent-color)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  点击或拖拽文件到此处
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  支持多文件选择
                </span>
              </label>
            </div>
          )}

          {activeTab === 'zip' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '20px' }}>
              <input
                type="file"
                accept=".zip"
                onChange={handleZipUpload}
                id="zip-upload"
                style={{ display: 'none' }}
              />
              <label
                htmlFor="zip-upload"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '32px 48px',
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const droppedFiles = e.dataTransfer.files
                  if (droppedFiles[0]?.name.endsWith('.zip')) {
                    const fakeEvent = { target: { files: droppedFiles } } as React.ChangeEvent<HTMLInputElement>
                    handleZipUpload(fakeEvent)
                  } else {
                    setError('请拖入 ZIP 文件')
                  }
                }}
              >
                <FileArchive size={32} style={{ color: 'var(--accent-color)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  点击或拖拽 ZIP 文件到此处
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  支持从 AI IDE 导出的 ZIP 文件
                </span>
              </label>
              {error && (
                <div style={{ padding: '8px 12px', background: 'rgba(248, 81, 73, 0.1)', borderRadius: '6px', color: '#f85149', fontSize: '13px' }}>
                  {error}
                </div>
              )}
              {loading && (
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  正在解析 ZIP...
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

export default ImportModal
