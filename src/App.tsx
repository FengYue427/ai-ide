import { useState, useCallback, useEffect, useRef } from 'react'
import { Play, Folder, MessageSquare, X, Plus, Download, Trash2, Moon, Sun, LayoutTemplate, Share2, GitBranch, FolderOpen, Bot, Search, Eye, Users, Save, Package, Puzzle, Upload, Shield, Code2, Activity, Command, FileText, Settings as SettingsIcon } from 'lucide-react'
import Editor from './components/Editor'
import ChatPanel from './components/ChatPanel'
import Terminal from './components/Terminal'
import TemplateModal from './components/TemplateModal'
import ShareModal from './components/ShareModal'
import GitPanel from './components/GitPanel'
import AISettingsModal from './components/AISettingsModal'
import ImportModal from './components/ImportModal'
import SearchPanel from './components/SearchPanel'
import PreviewPanel from './components/PreviewPanel'
import CollaborationPanel from './components/CollaborationPanel'
import DiffViewer from './components/DiffViewer'
import PluginManager from './components/PluginManager'
import DropZone from './components/DropZone'
import CodeReviewPanel from './components/CodeReviewPanel'
import SnippetLibrary from './components/SnippetLibrary'
import PerformancePanel from './components/PerformancePanel'
import SettingsCenter from './components/SettingsCenter'
import CommandPalette from './components/CommandPalette'
import StatusBar from './components/StatusBar'
import EmptyState from './components/EmptyState'
import WorkspaceManager from './components/WorkspaceManager'
import WorkspacePanel from './components/WorkspacePanel'
import ThemeSelector from './components/ThemeSelector'
import WelcomeScreen from './components/WelcomeScreen'
import { useWebContainer } from './hooks/useWebContainer'
import { useKeyboardShortcuts, getDefaultShortcuts } from './hooks/useKeyboardShortcuts'
import { useDebounce } from './hooks/useDebounce'
import { getShare } from './services/shareService'
import type { AIModel } from './services/aiService'
import { storageService } from './services/storageService'
import { localStorageService, StorageKeys } from './services/localStorageService'
import { I18nProvider } from './i18n'
import { recentFilesService, type RecentProject } from './services/recentFilesService'

interface FileItem {
  name: string
  content: string
  language: string
}

const getLanguageFromExt = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'py': 'python',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown'
  }
  return map[ext] || 'plaintext'
}

function AppContent() {
  const [files, setFiles] = useState<FileItem[]>([
    { name: 'index.js', content: '// 欢迎使用 AI IDE\nconsole.log("Hello World!");', language: 'javascript' }
  ])
  const [activeFile, setActiveFile] = useState(0)
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [aiConfig, setAiConfig] = useState({
    provider: localStorageService.get(StorageKeys.AI_CONFIG, { provider: 'openai' as AIModel, apiKey: '', model: 'gpt-4o-mini', endpoint: '' }).provider,
    apiKey: localStorageService.get(StorageKeys.AI_CONFIG, { provider: 'openai' as AIModel, apiKey: '', model: 'gpt-4o-mini', endpoint: '' }).apiKey,
    model: localStorageService.get(StorageKeys.AI_CONFIG, { provider: 'openai' as AIModel, apiKey: '', model: 'gpt-4o-mini', endpoint: '' }).model,
    endpoint: localStorageService.get(StorageKeys.AI_CONFIG, { provider: 'openai' as AIModel, apiKey: '', model: 'gpt-4o-mini', endpoint: '' }).endpoint
  })
  const [theme, setTheme] = useState<'vs-dark' | 'light'>(localStorageService.get(StorageKeys.THEME, 'vs-dark'))
  const [showTerminal, setShowTerminal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showGitPanel, setShowGitPanel] = useState(false)
  const [showAISettings, setShowAISettings] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => localStorageService.get(StorageKeys.SETTINGS, { autosave: true }).autosave)
  const [showPluginManager, setShowPluginManager] = useState(false)
  const [showDropZone, setShowDropZone] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [diffContent, setDiffContent] = useState<{ old: string; new: string } | null>(null)
  const [showCodeReview, setShowCodeReview] = useState(false)
  const [showSnippetLibrary, setShowSnippetLibrary] = useState(false)
  const [showPerformance, setShowPerformance] = useState(false)
  const [showSettingsCenter, setShowSettingsCenter] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showChatPanel, setShowChatPanel] = useState(false)
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false)
  const [showWorkspacePanel, setShowWorkspacePanel] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])

  const { isReady, output, isRunning, writeFile, runNode, fs } = useWebContainer()

  // 检查 URL 参数中的分享 ID 和协作房间
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareId = params.get('share')
    const roomId = params.get('room')
    
    if (shareId) {
      const shareData = getShare(shareId)
      if (shareData) {
        setFiles(shareData.files)
      }
      window.history.replaceState({}, '', window.location.pathname)
    }
    
    if (roomId) {
      setShowCollaboration(true)
    }
  }, [])

  // 加载自动保存的项目
  useEffect(() => {
    storageService.loadAutoSave('default').then((savedFiles: any) => {
      if (savedFiles && savedFiles.length > 0) {
        setFiles(savedFiles.map((f: any) => ({
          name: f.name,
          content: f.content,
          language: f.language
        })))
      } else {
        // 没有项目时显示欢迎页
        setShowWelcome(true)
      }
    })
  }, [])

  // 加载最近项目
  useEffect(() => {
    recentFilesService.getRecentProjects().then(setRecentProjects)
  }, [])

  // 自动保存
  useEffect(() => {
    if (!autoSaveEnabled) return
    
    const timer = setTimeout(() => {
      const ideFiles = files.map((f, index) => ({
        id: index.toString(),
        name: f.name,
        content: f.content,
        language: f.language,
        lastModified: Date.now()
      }))
      storageService.autoSave(ideFiles, 'default')
    }, 3000) // 3秒后自动保存

    return () => clearTimeout(timer)
  }, [files, autoSaveEnabled])

  // 防抖的文件内容更新（优化大文件编辑性能）
  const debouncedFileChange = useDebounce((index: number, content: string | undefined) => {
    if (content === undefined) return
    setFiles(prevFiles => {
      const newFiles = [...prevFiles]
      newFiles[index] = { ...newFiles[index], content }
      return newFiles
    })
  }, 150) // 150ms 延迟，平衡响应性和性能

  const handleFileChange = (content: string | undefined) => {
    if (content === undefined) return
    // 使用防抖更新，减少大文件时的重渲染频率
    debouncedFileChange(activeFile, content)
  }

  const handleSaveAISettings = (config: typeof aiConfig) => {
    setAiConfig(config)
    localStorageService.set(StorageKeys.AI_CONFIG, config)
    setShowAISettings(false)
  }

  const handleApplyTemplate = (templateFiles: { name: string; content: string; language: string }[]) => {
    setFiles(templateFiles)
    setActiveFile(0)
    setShowTemplateModal(false)
  }

  const handleImportFiles = (importedFiles: { name: string; content: string }[]) => {
    const filesWithLang = importedFiles.map(f => ({
      ...f,
      language: getLanguageFromExt(f.name)
    }))
    setFiles(filesWithLang)
    setActiveFile(0)
    setShowDropZone(false)
  }

  // 搜索和替换处理
  const handleSearchNavigate = (fileName: string, _line: number) => {
    const fileIndex = files.findIndex(f => f.name === fileName)
    if (fileIndex >= 0) {
      setActiveFile(fileIndex)
      // 这里可以添加跳转到指定行的逻辑
    }
  }

  const handleSearchReplace = (fileName: string, newContent: string) => {
    const fileIndex = files.findIndex(f => f.name === fileName)
    if (fileIndex >= 0) {
      const newFiles = [...files]
      newFiles[fileIndex] = { ...newFiles[fileIndex], content: newContent }
      setFiles(newFiles)
    }
  }

  const handleCreateFile = () => {
    if (!newFileName.trim()) return
    const name = newFileName.trim()
    if (files.some(f => f.name === name)) {
      alert('文件已存在')
      return
    }
    const newFile: FileItem = {
      name,
      content: '',
      language: getLanguageFromExt(name)
    }
    setFiles([...files, newFile])
    setActiveFile(files.length)
    setNewFileName('')
    setShowNewFileInput(false)
  }

  const handleDeleteFile = (idx: number) => {
    if (files.length <= 1) {
      alert('至少保留一个文件')
      return
    }
    const newFiles = files.filter((_, i) => i !== idx)
    setFiles(newFiles)
    if (activeFile >= idx && activeFile > 0) {
      setActiveFile(activeFile - 1)
    }
  }

  const handleExportFile = () => {
    const file = files[activeFile]
    if (!file) return
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'vs-dark' ? 'light' : 'vs-dark'
    setTheme(newTheme)
    localStorageService.set(StorageKeys.THEME, newTheme)
  }

  const handleRunCode = useCallback(async () => {
    if (!isReady) {
      alert('WebContainer 正在初始化，请稍后再试')
      return
    }
    const file = files[activeFile]
    if (!file) return

    // 写入当前文件到 WebContainer
    await writeFile(file.name, file.content)
    
    // 写入其他文件
    for (const f of files) {
      if (f.name !== file.name) {
        await writeFile(f.name, f.content)
      }
    }

    // 运行代码
    await runNode(file.name)
  }, [isReady, files, activeFile, writeFile, runNode])

  const clearTerminal = () => {
    // 通过重新挂载组件来清空
    setShowTerminal(false)
    setTimeout(() => setShowTerminal(true), 10)
  }

  // 导出项目为 ZIP
  const handleExportZip = async () => {
    const blob = await storageService.exportToZip('default')
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'project.zip'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className={`app ${theme === 'light' ? 'light-theme' : ''}`}>
      {/* 顶部工具栏 */}
      <div className="toolbar">
        {/* 文件菜单 */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNewFileInput(true)}>
            <FileText size={14} />
            <span>文件</span>
          </button>
        </div>

        {/* 编辑菜单 */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowSearchPanel(true)}>
            <Search size={14} />
            <span>编辑</span>
          </button>
        </div>

        {/* 运行菜单 */}
        <div style={{ position: 'relative' }}>
          <button onClick={handleRunCode} disabled={isRunning || !isReady}>
            <Play size={14} />
            <span>{isRunning ? '运行中...' : '运行'}</span>
          </button>
        </div>

        {/* AI 菜单 */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowChatPanel?.(true)}>
            <Bot size={14} />
            <span>AI</span>
          </button>
        </div>

        {/* 工作区菜单 */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowWorkspacePanel(true)}>
            <FolderOpen size={14} />
            <span>工作区</span>
          </button>
        </div>

        {/* 协作菜单 */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowGitPanel(!showGitPanel)}>
            <GitBranch size={14} />
            <span>协作</span>
          </button>
        </div>

        {/* 查看菜单 */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowPreview(true)}>
            <Eye size={14} />
            <span>查看</span>
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* 命令面板按钮 */}
        <button
          onClick={() => setShowCommandPalette(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          <Command size={14} />
          <span>命令面板</span>
          <kbd style={{ fontSize: '11px', opacity: 0.6 }}>Ctrl+Shift+P</kbd>
        </button>

        {/* 设置按钮 */}
        <button
          onClick={() => setShowSettingsCenter(true)}
          style={{
            padding: '6px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
          title="设置"
        >
          <SettingsIcon size={18} />
        </button>

        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          v0.8.0
        </span>
      </div>

      {/* 主工作区 */}
      <div className="workspace">
        {/* 左侧文件树 */}
        <div className="sidebar">
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Folder size={14} style={{ marginRight: 6 }} />
              文件
            </div>
            <button
              onClick={() => setShowNewFileInput(true)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                padding: 4,
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Plus size={14} />
            </button>
          </div>
          <div style={{ padding: 8 }}>
            {showNewFileInput && (
              <div style={{ marginBottom: 8, display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                  placeholder="文件名"
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: 12,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    color: 'var(--text-primary)'
                  }}
                  autoFocus
                />
                <button
                  onClick={handleCreateFile}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    background: 'var(--accent-color)',
                    border: 'none',
                    borderRadius: 4,
                    color: 'var(--bg-primary)',
                    cursor: 'pointer'
                  }}
                >
                  确定
                </button>
              </div>
            )}
            {files.length === 0 ? (
              <EmptyState
                type="files"
                onAction={() => setShowNewFileInput(true)}
                onSecondaryAction={() => setShowDropZone(true)}
              />
            ) : (
              files.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                    background: idx === activeFile ? 'var(--bg-tertiary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => setActiveFile(idx)}
                >
                  <span>{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFile(idx)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: 'var(--text-secondary)',
                      display: files.length > 1 ? 'flex' : 'none',
                      alignItems: 'center'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 搜索面板 */}
        {showSearchPanel && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '320px', zIndex: 100 }}>
            <SearchPanel
              files={files}
              onNavigate={handleSearchNavigate}
              onReplace={handleSearchReplace}
              onClose={() => setShowSearchPanel(false)}
            />
          </div>
        )}

        {/* 编辑器区域 */}
        <div className="editor-container">
          <div className="tabs">
            {files.map((file, idx) => (
              <div
                key={idx}
                className={`tab ${idx === activeFile ? 'active' : ''}`}
                onClick={() => setActiveFile(idx)}
              >
                {file.name}
                <span className="tab-close" onClick={(e) => {
                  e.stopPropagation()
                  if (files.length > 1) {
                    const newFiles = files.filter((_, i) => i !== idx)
                    setFiles(newFiles)
                    if (activeFile >= idx && activeFile > 0) {
                      setActiveFile(activeFile - 1)
                    }
                  }
                }}>
                  <X size={12} />
                </span>
              </div>
            ))}
          </div>
          <div className="monaco-wrapper">
            <Editor
              value={files[activeFile]?.content || ''}
              language={files[activeFile]?.language || 'javascript'}
              theme={theme}
              onChange={handleFileChange}
            />
          </div>
          {showTerminal && (
            <Terminal
              output={output}
              isRunning={isRunning}
              onRun={handleRunCode}
              onClear={clearTerminal}
            />
          )}

          {/* 预览面板 */}
          {showPreview && (
            <PreviewPanel
              content={files[activeFile]?.content || ''}
              fileName={files[activeFile]?.name || ''}
              onClose={() => setShowPreview(false)}
              onRefresh={() => {}}
            />
          )}
        </div>

        {/* 右侧面板 */}
        {(showGitPanel || showChatPanel) && (
          <div className="right-panel" style={{ width: showGitPanel ? '360px' : '320px', display: 'flex', flexDirection: 'column' }}>
            {showGitPanel ? (
              <>
                <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitBranch size={14} />
                    Git
                  </div>
                  <button 
                    onClick={() => setShowGitPanel(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <GitPanel 
                    fs={fs} 
                    files={files.map(f => f.name)} 
                    onFilesChange={() => {}}
                  />
                </div>
              </>
            ) : showChatPanel ? (
              <>
                <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={14} />
                    AI 助手
                  </div>
                  <button 
                    onClick={() => setShowChatPanel(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <ChatPanel 
                    aiConfig={aiConfig}
                    currentCode={files[activeFile]?.content || ''}
                    onGenerateFiles={(newFiles: { name: string; content: string; language: string }[]) => {
                      setFiles(prev => [...prev, ...newFiles])
                    }}
                  />
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* 模板选择弹窗 */}
      {showTemplateModal && (
        <TemplateModal
          onSelect={handleApplyTemplate}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      {/* 分享弹窗 */}
      {showShareModal && (
        <ShareModal
          files={files}
          onImport={handleImportFiles}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* AI 设置弹窗 */}
      {showAISettings && (
        <AISettingsModal
          config={aiConfig}
          onSave={handleSaveAISettings}
          onClose={() => setShowAISettings(false)}
        />
      )}

      {/* 导入弹窗 */}
      {showImportModal && (
        <ImportModal
          onImport={handleImportFiles}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* 协作弹窗 */}
      {showCollaboration && (
        <CollaborationPanel
          onClose={() => setShowCollaboration(false)}
        />
      )}

      {/* 插件管理 */}
      {showPluginManager && (
        <PluginManager
          onClose={() => setShowPluginManager(false)}
        />
      )}

      {/* 文件拖拽导入 */}
      {showDropZone && (
        <DropZone
          onFilesDrop={handleImportFiles}
          onClose={() => setShowDropZone(false)}
        />
      )}

      {/* 代码对比 */}
      {showDiff && diffContent && (
        <DiffViewer
          oldContent={diffContent.old}
          newContent={diffContent.new}
          onClose={() => setShowDiff(false)}
        />
      )}

      {/* 代码审查 */}
      {showCodeReview && files[activeFile] && (
        <CodeReviewPanel
          code={files[activeFile].content}
          language={files[activeFile].language}
          filename={files[activeFile].name}
          aiConfig={aiConfig}
          onClose={() => setShowCodeReview(false)}
        />
      )}

      {/* 代码片段库 */}
      {showSnippetLibrary && (
        <SnippetLibrary
          onInsert={(code) => {
            const newFiles = [...files]
            newFiles[activeFile].content += '\n' + code
            setFiles(newFiles)
          }}
          currentLanguage={files[activeFile]?.language}
          onClose={() => setShowSnippetLibrary(false)}
        />
      )}

      {/* 性能分析 */}
      {showPerformance && (
        <PerformancePanel
          isRunning={isRunning}
          output={output}
          onClose={() => setShowPerformance(false)}
        />
      )}

      {/* 命令面板 */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        files={files}
        activeFile={activeFile}
        onSelectFile={setActiveFile}
        onNewFile={() => setShowNewFileInput(true)}
        onRunCode={handleRunCode}
        onOpenSettings={() => setShowSettingsCenter(true)}
        onOpenGit={() => setShowGitPanel(true)}
        onOpenShare={() => setShowShareModal(true)}
        onOpenAIChat={() => setShowChatPanel(true)}
        onOpenSnippetLibrary={() => setShowSnippetLibrary(true)}
        onOpenTerminal={() => setShowTerminal(true)}
        onOpenPreview={() => setShowPreview(true)}
        onOpenCodeReview={() => setShowCodeReview(true)}
        onOpenPerformance={() => setShowPerformance(true)}
        onOpenPluginManager={() => setShowPluginManager(true)}
        onExportZip={handleExportZip}
        onToggleTheme={toggleTheme}
        onToggleAutoSave={() => setAutoSaveEnabled(!autoSaveEnabled)}
        onOpenCollaboration={() => setShowCollaboration(true)}
        onExportFile={handleExportFile}
        onOpenImport={() => setShowImportModal(true)}
        onOpenSearch={() => setShowSearchPanel(true)}
        theme={theme}
        autoSaveEnabled={autoSaveEnabled}
      />

      {/* 统一设置中心 */}
      {showSettingsCenter && (
        <SettingsCenter
          aiConfig={aiConfig}
          theme={theme}
          autoSaveEnabled={autoSaveEnabled}
          language="zh"
          onSaveAIConfig={(config) => {
            setAiConfig(config)
            localStorageService.set(StorageKeys.AI_CONFIG, config)
          }}
          onToggleTheme={toggleTheme}
          onToggleAutoSave={() => {
            const newValue = !autoSaveEnabled
            setAutoSaveEnabled(newValue)
            localStorageService.set(StorageKeys.SETTINGS, { autosave: newValue })
          }}
          onChangeLanguage={(lang) => {
            localStorageService.set(StorageKeys.LANGUAGE, lang)
            window.location.reload()
          }}
          onClose={() => setShowSettingsCenter(false)}
        />
      )}

      {/* 工作区管理 */}
      {showWorkspaceManager && (
        <WorkspaceManager
          currentFiles={files}
          currentSettings={{
            theme,
            autoSave: autoSaveEnabled,
            language: 'zh',
            aiProvider: aiConfig.provider,
            aiModel: aiConfig.model
          }}
          onLoadWorkspace={(loadedFiles, settings) => {
            setFiles(loadedFiles)
            setActiveFile(0)
            if (settings.theme) setTheme(settings.theme as any)
            if (settings.autoSave !== undefined) setAutoSaveEnabled(settings.autoSave)
          }}
          onClose={() => setShowWorkspaceManager(false)}
        />
      )}

      {/* 工作区面板 - AI工作区上下文 */}
      {showWorkspacePanel && (
        <WorkspacePanel
          onClose={() => setShowWorkspacePanel(false)}
          onFilesChange={(workspaceFiles) => {
            // 将工作区文件同步到编辑器
            if (workspaceFiles.length > 0) {
              setFiles(workspaceFiles)
              setActiveFile(0)
            }
          }}
          currentFiles={files}
        />
      )}

      {/* 主题选择器 */}
      {showThemeSelector && (
        <ThemeSelector
          currentTheme={theme}
          onChangeTheme={(newTheme) => {
            setTheme(newTheme as any)
            localStorageService.set(StorageKeys.THEME, newTheme)
          }}
          onClose={() => setShowThemeSelector(false)}
        />
      )}

      {/* 底部状态栏 */}
      <StatusBar
        currentFileName={files[activeFile]?.name || '无文件'}
        currentFileLanguage={files[activeFile]?.language || 'plaintext'}
        lineCount={files[activeFile]?.content.split('\n').length || 0}
        charCount={files[activeFile]?.content.length || 0}
        isWebContainerReady={isReady}
        aiProvider={aiConfig.provider}
        isAIConnected={!!aiConfig.apiKey}
        autoSaveEnabled={autoSaveEnabled}
        language="zh"
        onOpenSettings={() => setShowSettingsCenter(true)}
        onOpenAISettings={() => setShowAISettings(true)}
        onToggleAutoSave={() => setAutoSaveEnabled(!autoSaveEnabled)}
      />

      {/* 欢迎页面 */}
      {showWelcome && (
        <WelcomeScreen
          recentProjects={recentProjects}
          onNewProject={() => {
            setShowWelcome(false)
            setShowNewFileInput(true)
          }}
          onOpenProject={() => {
            setShowWelcome(false)
            setShowWorkspaceManager(true)
          }}
          onOpenWorkspace={(id) => {
            setShowWelcome(false)
            // 加载工作区逻辑
          }}
          onOpenSettings={() => {
            setShowWelcome(false)
            setShowSettingsCenter(true)
          }}
          onOpenAIChat={() => {
            setShowWelcome(false)
            setShowChatPanel(true)
          }}
        />
      )}

      {/* 键盘快捷键 */}
      {(() => {
        useKeyboardShortcuts(getDefaultShortcuts({
          onSave: () => {
            const ideFiles = files.map((f, index) => ({
              id: index.toString(),
              name: f.name,
              content: f.content,
              language: f.language,
              lastModified: Date.now()
            }))
            storageService.autoSave(ideFiles, 'default')
          },
          onNewFile: () => setShowNewFileInput(true),
          onOpenFile: () => setShowImportModal(true),
          onRun: handleRunCode,
          onSearch: () => setShowSearchPanel(true),
          onCommandPalette: () => setShowCommandPalette(true),
          onToggleTerminal: () => setShowTerminal(!showTerminal),
        }), true)
        return null
      })()}

    </div>
  )
}

// 主应用组件，包裹 I18nProvider
function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  )
}

export default App
