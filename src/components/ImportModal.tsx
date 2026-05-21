import React, { useState } from 'react'
import { FileArchive, FolderOpen, Github, Link2, Upload } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import JSZip from 'jszip'
import { fetchRepoContents, getRepoBranches, parseGitHubUrl } from '../services/githubService'
import { ModalShell } from './ui/ModalShell'

interface ImportModalProps {
  onImport: (files: { name: string; content: string; language: string }[]) => void
  onClose: () => void
}

const langMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  jsx: 'javascript',
  tsx: 'typescript',
  py: 'python',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  vue: 'html',
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

  const normalizeFiles = (input: { name: string; content: string }[]) =>
    input.map((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      return {
        name: file.name,
        content: file.content,
        language: langMap[ext] || 'plaintext',
      }
    })

  const handleParseUrl = async () => {
    const info = parseGitHubUrl(url)
    if (!info) {
      setError('请输入有效的 GitHub 仓库地址。')
      return
    }

    setLoading(true)
    setError('')
    try {
      setRepoInfo({ owner: info.owner, repo: info.repo })
      const branchList = await getRepoBranches(info.owner, info.repo, token || undefined)
      setBranches(branchList)
      setSelectedBranch(info.branch || branchList[0] || 'main')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '读取仓库分支失败。'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleImportRepo = async () => {
    if (!repoInfo) return
    setLoading(true)
    setError('')

    try {
      const result = await fetchRepoContents(repoInfo.owner, repoInfo.repo, '', selectedBranch, token || undefined)
      if (result.error) {
        setError(result.error)
      } else if (result.files.length === 0) {
        setError('没有找到可导入的文本文件。')
      } else {
        onImport(
          result.files.map((file) => {
            const ext = file.path.split('.').pop()?.toLowerCase() || ''
            return {
              name: file.path,
              content: file.content,
              language: langMap[ext] || 'plaintext',
            }
          }),
        )
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList) return

    const files: { name: string; content: string }[] = []
    let processed = 0

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        files.push({ name: file.name, content: (loadEvent.target?.result as string) || '' })
        processed += 1
        if (processed === fileList.length) {
          onImport(normalizeFiles(files))
          onClose()
        }
      }
      reader.readAsText(file)
    })
  }

  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.zip')) {
      setError('请选择 ZIP 文件。')
      return
    }

    setLoading(true)
    setError('')
    try {
      const zip = await new JSZip().loadAsync(await file.arrayBuffer())
      const files: { name: string; content: string }[] = []
      const tasks: Promise<void>[] = []

      zip.forEach((_relativePath, entry) => {
        if (!entry.dir) {
          tasks.push(
            entry.async('string').then((content) => {
              files.push({ name: entry.name, content })
            }),
          )
        }
      })

      await Promise.all(tasks)
      if (files.length === 0) {
        setError('ZIP 中没有可导入的文件。')
      } else {
        onImport(normalizeFiles(files))
        onClose()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '未知错误'
      setError(`解析 ZIP 失败：${message}`)
    } finally {
      setLoading(false)
    }
  }

  const DropZone = ({
    icon: Icon,
    title,
    subtitle,
    inputId,
    accept,
    multiple,
    onChange,
    onDrop,
  }: {
    icon: LucideIcon
    title: string
    subtitle: string
    inputId: string
    accept?: string
    multiple?: boolean
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    onDrop: (event: React.DragEvent<HTMLLabelElement>) => void
  }) => (
    <>
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="import-file-hidden"
        onChange={onChange}
      />
      <label
        htmlFor={inputId}
        className="import-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <Icon size={32} className="import-dropzone__icon" />
        <div className="import-dropzone__title">{title}</div>
        <div className="import-dropzone__desc">{subtitle}</div>
      </label>
    </>
  )

  return (
    <ModalShell
      className="modal--import"
      bodyClassName="modal-body--stack"
      ariaLabel="导入项目"
      title={
        <span className="modal-title-row">
          <FolderOpen size={18} />
          导入项目
        </span>
      }
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          取消
        </button>
      }
    >
      <div className="import-hero">
        <div className="import-hero__title">把代码带进来，然后马上开工</div>
        <div className="import-hero__desc">
          支持 GitHub 仓库、直接上传文件，以及 ZIP 打包导入。导入后会自动识别常见语言类型。
        </div>
      </div>

      <div className="import-tabs">
        {[
          { id: 'github' as const, icon: Github, label: 'GitHub' },
          { id: 'upload' as const, icon: Upload, label: '上传文件' },
          { id: 'zip' as const, icon: FileArchive, label: 'ZIP 导入' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`import-tab ${activeTab === tab.id ? 'import-tab--active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id)
              setError('')
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'github' && (
        <div className="import-stack">
          <div className="import-panel">
            <div className="import-stack">
              <div className="form-group">
                <label className="form-label">GitHub 仓库地址</label>
                <div className="import-form-row">
                  <input
                    type="text"
                    className="form-input"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://github.com/owner/repo"
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleParseUrl} disabled={loading}>
                    <Link2 size={14} />
                  </button>
                </div>
              </div>

              {branches.length > 0 && (
                <div className="form-group">
                  <label className="form-label">分支</label>
                  <select
                    className="form-input"
                    value={selectedBranch}
                    onChange={(event) => setSelectedBranch(event.target.value)}
                  >
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">GitHub Token（可选）</label>
                <input
                  type="password"
                  className="form-input"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="用于私有仓库"
                />
              </div>
            </div>
          </div>

          <button type="button" className="btn btn-primary" onClick={handleImportRepo} disabled={!repoInfo || loading}>
            {loading ? '导入中...' : '导入仓库'}
          </button>
        </div>
      )}

      {activeTab === 'upload' && (
        <DropZone
          icon={Upload}
          title="点击或拖拽文件到这里"
          subtitle="适合少量源码文件、配置文件和文档快速导入。支持多选。"
          inputId="file-upload"
          multiple
          onChange={handleFileUpload}
          onDrop={(event) => {
            event.preventDefault()
            const fakeEvent = { target: { files: event.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>
            handleFileUpload(fakeEvent)
          }}
        />
      )}

      {activeTab === 'zip' && (
        <DropZone
          icon={FileArchive}
          title="导入 ZIP 打包项目"
          subtitle="适合把完整项目一次性带进来，也适合恢复之前导出的压缩包。"
          inputId="zip-upload"
          accept=".zip"
          onChange={handleZipUpload}
          onDrop={(event) => {
            event.preventDefault()
            const files = event.dataTransfer.files
            if (!files[0]?.name.endsWith('.zip')) {
              setError('请拖入 ZIP 文件。')
              return
            }
            const fakeEvent = { target: { files } } as React.ChangeEvent<HTMLInputElement>
            handleZipUpload(fakeEvent)
          }}
        />
      )}

      {error && <div className="alert-banner alert-banner--error">{error}</div>}
    </ModalShell>
  )
}

export default ImportModal
