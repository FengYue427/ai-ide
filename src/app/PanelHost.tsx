import DropZone from '../components/DropZone'
import StatusBar from '../components/StatusBar'
import WorkspacePanel from '../components/WorkspacePanel'
import { modelOptions } from '../services/aiService'
import { unifiedStorage, StorageLayer } from '../services/unifiedStorage'
import { useIDEStore, type EditorTheme } from '../store/ideStore'
import {
  AISettingsModal,
  AuthModal,
  CodeReviewPanel,
  CollaborationPanel,
  CommandPalette,
  DiffViewer,
  ImportModal,
  PerformancePanel,
  PluginManager,
  SettingsCenter,
  ShareModal,
  SnippetLibrary,
  SubscriptionModal,
  AgentApplyModal,
  TemplateModal,
  ThemeSelector,
  WelcomeScreen,
  WorkspaceManager,
} from './lazyPanels'
import type { ConfirmRequest, ToastKind } from '../components/FeedbackCenter'
import type { FileItem } from '../types/file'
import type { AIConfigState } from '../store/ideStore'
import {
  collectRulesSources,
  DEFAULT_PROJECT_RULES_TEMPLATE,
  extractProjectRules,
  PROJECT_RULES_PATH,
} from '../services/projectRulesService'
import { workspaceContextService } from '../services/workspaceContextService'
import { useI18n } from '../i18n'

interface PanelHostProps {
  notify: (kind: ToastKind, title: string, detail?: string) => void
  requestConfirm: (request: ConfirmRequest) => Promise<boolean>
  onApplyTemplate: (files: FileItem[]) => void
  onSaveAISettings: (config: AIConfigState) => void
  onImportFiles: (files: { name: string; content: string }[]) => void
  onExportFile: () => void
  onExportZip: () => void
  onRunCode: () => void
  onRunNpmScript: (scriptName: string) => void | Promise<void>
  onToggleTheme: () => void
  closeCommandPalette: () => void
  closeSettingsPanel: () => void
  openNewFileInput: () => void
  openSettingsPanel: () => void
  openGitPanel: () => void
  openShareDialog: () => void
  openChatPanel: () => void
  openSnippetPanel: () => void
  openTerminalPanel: () => void
  openPreviewPanel: () => void
  openCodeReviewPanel: () => void
  openPerformanceDialog: () => void
  openPluginDialog: () => void
  openCollaborationDialog: () => void
  openImportDialog: () => void
  openSearchPanel: () => void
  closeWelcomeAnd: (action: () => void) => void
  openWorkspaceManagerModal: () => void
  openWorkspacePanelModal: () => void
  openTemplateModal: () => void
  openThemeSelector: () => void
  openWelcomeScreen: () => void
  onOpenRecentWorkspace: (workspaceId: string) => void | Promise<void>
  onTestsGenerated: (fileName: string, content: string) => void
  isRunning: boolean
  output: string[]
  isWebContainerReady: boolean
  gitBranch?: string
  gitModified?: number
}

export function PanelHost({
  notify,
  requestConfirm,
  onApplyTemplate,
  onSaveAISettings,
  onImportFiles,
  onExportFile,
  onExportZip,
  onRunCode,
  onRunNpmScript,
  onToggleTheme,
  closeCommandPalette,
  closeSettingsPanel,
  openNewFileInput,
  openSettingsPanel,
  openGitPanel,
  openShareDialog,
  openChatPanel,
  openSnippetPanel,
  openTerminalPanel,
  openPreviewPanel,
  openCodeReviewPanel,
  openPerformanceDialog,
  openPluginDialog,
  openCollaborationDialog,
  openImportDialog,
  openSearchPanel,
  closeWelcomeAnd,
  openWorkspaceManagerModal,
  openWorkspacePanelModal,
  openTemplateModal,
  openThemeSelector,
  openWelcomeScreen,
  onOpenRecentWorkspace,
  onTestsGenerated,
  isRunning,
  output,
  isWebContainerReady,
  gitBranch,
  gitModified = 0,
}: PanelHostProps) {
  const { language, setLanguage } = useI18n()
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const theme = useIDEStore((s) => s.theme)
  const aiConfig = useIDEStore((s) => s.aiConfig)
  const autoSaveEnabled = useIDEStore((s) => s.autoSaveEnabled)
  const diffContent = useIDEStore((s) => s.diffContent)
  const diagnosticCount = useIDEStore((s) => s.diagnosticCount)
  const recentProjects = useIDEStore((s) => s.recentProjects)
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const showTemplateModal = useIDEStore((s) => s.showTemplateModal)
  const showShareModal = useIDEStore((s) => s.showShareModal)
  const showAISettings = useIDEStore((s) => s.showAISettings)
  const showAuthModal = useIDEStore((s) => s.showAuthModal)
  const showSubscriptionModal = useIDEStore((s) => s.showSubscriptionModal)
  const showImportModal = useIDEStore((s) => s.showImportModal)
  const showCollaboration = useIDEStore((s) => s.showCollaboration)
  const showPluginManager = useIDEStore((s) => s.showPluginManager)
  const showDropZone = useIDEStore((s) => s.showDropZone)
  const showDiff = useIDEStore((s) => s.showDiff)
  const showAgentApplyModal = useIDEStore((s) => s.showAgentApplyModal)
  const showCodeReview = useIDEStore((s) => s.showCodeReview)
  const showSnippetLibrary = useIDEStore((s) => s.showSnippetLibrary)
  const showPerformance = useIDEStore((s) => s.showPerformance)
  const showSettingsCenter = useIDEStore((s) => s.showSettingsCenter)
  const showCommandPalette = useIDEStore((s) => s.showCommandPalette)
  const showWorkspaceManager = useIDEStore((s) => s.showWorkspaceManager)
  const showWorkspacePanel = useIDEStore((s) => s.showWorkspacePanel)
  const showThemeSelector = useIDEStore((s) => s.showThemeSelector)
  const showWelcome = useIDEStore((s) => s.showWelcome)

  const setFiles = useIDEStore((s) => s.setFiles)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setEditorTarget = useIDEStore((s) => s.setEditorTarget)

  const projectRulesPreview = extractProjectRules(
    collectRulesSources(
      files,
      workspaceContextService.getAllFiles().map((file) => ({ path: file.path, content: file.content })),
    ),
  )
  const setTheme = useIDEStore((s) => s.setTheme)
  const setAiConfig = useIDEStore((s) => s.setAiConfig)
  const setAutoSaveEnabled = useIDEStore((s) => s.setAutoSaveEnabled)
  const setCurrentUser = useIDEStore((s) => s.setCurrentUser)
  const setShowAISettings = useIDEStore((s) => s.setShowAISettings)

  const setShowTemplateModal = useIDEStore((s) => s.setShowTemplateModal)
  const setShowShareModal = useIDEStore((s) => s.setShowShareModal)
  const setShowAuthModal = useIDEStore((s) => s.setShowAuthModal)
  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)
  const setShowImportModal = useIDEStore((s) => s.setShowImportModal)
  const setShowCollaboration = useIDEStore((s) => s.setShowCollaboration)
  const setShowPluginManager = useIDEStore((s) => s.setShowPluginManager)
  const setShowDropZone = useIDEStore((s) => s.setShowDropZone)
  const setShowDiff = useIDEStore((s) => s.setShowDiff)
  const setShowCodeReview = useIDEStore((s) => s.setShowCodeReview)
  const setShowSnippetLibrary = useIDEStore((s) => s.setShowSnippetLibrary)
  const setShowPerformance = useIDEStore((s) => s.setShowPerformance)
  const setShowWorkspaceManager = useIDEStore((s) => s.setShowWorkspaceManager)
  const setShowWorkspacePanel = useIDEStore((s) => s.setShowWorkspacePanel)
  const setShowThemeSelector = useIDEStore((s) => s.setShowThemeSelector)

  return (
    <>
      {showTemplateModal && (
        <TemplateModal onSelect={onApplyTemplate} onClose={() => setShowTemplateModal(false)} />
      )}

      {showShareModal && (
        <ShareModal files={files} onImport={onImportFiles} onClose={() => setShowShareModal(false)} />
      )}

      {showAISettings && (
        <AISettingsModal config={aiConfig} onSave={onSaveAISettings} onClose={() => setShowAISettings(false)} />
      )}

      {showAuthModal && (
        <AuthModal
          onAuthenticated={(user) => {
            setCurrentUser(user)
            setShowAuthModal(false)
            notify('success', `已登录：${user.email}`)
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} currentPlan={currentPlan} />
      )}

      {showImportModal && <ImportModal onImport={onImportFiles} onClose={() => setShowImportModal(false)} />}

      {showCollaboration && <CollaborationPanel onClose={() => setShowCollaboration(false)} />}

      {showPluginManager && <PluginManager onClose={() => setShowPluginManager(false)} />}

      {showDropZone && <DropZone onFilesDrop={onImportFiles} onClose={() => setShowDropZone(false)} />}

      {showDiff && diffContent && (
        <DiffViewer
          oldContent={diffContent.old}
          newContent={diffContent.new}
          onClose={() => setShowDiff(false)}
        />
      )}

      {showAgentApplyModal && <AgentApplyModal />}

      {showCodeReview && files[activeFile] && (
        <CodeReviewPanel
          code={files[activeFile].content}
          language={files[activeFile].language}
          filename={files[activeFile].name}
          aiConfig={aiConfig}
          onClose={() => setShowCodeReview(false)}
          onTestsGenerated={onTestsGenerated}
        />
      )}

      {showSnippetLibrary && (
        <SnippetLibrary
          onInsert={(code) => {
            const next = [...files]
            next[activeFile] = { ...next[activeFile], content: next[activeFile].content + '\n' + code }
            setFiles(next)
          }}
          currentLanguage={files[activeFile]?.language}
          notify={notify}
          requestConfirm={requestConfirm}
          onClose={() => setShowSnippetLibrary(false)}
        />
      )}

      {showPerformance && (
        <PerformancePanel isRunning={isRunning} output={output} onClose={() => setShowPerformance(false)} />
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={closeCommandPalette}
        files={files}
        activeFile={activeFile}
        onSelectFile={setActiveFile}
        onNewFile={openNewFileInput}
        onRunCode={onRunCode}
        onRunNpmScript={onRunNpmScript}
        onOpenSettings={openSettingsPanel}
        onOpenGit={openGitPanel}
        onOpenShare={openShareDialog}
        onOpenAIChat={openChatPanel}
        onOpenSnippetLibrary={openSnippetPanel}
        onOpenTerminal={openTerminalPanel}
        onOpenPreview={openPreviewPanel}
        onOpenCodeReview={openCodeReviewPanel}
        onOpenPerformance={openPerformanceDialog}
        onOpenPluginManager={openPluginDialog}
        onExportZip={onExportZip}
        onToggleTheme={onToggleTheme}
        onToggleAutoSave={() => setAutoSaveEnabled(!autoSaveEnabled)}
        onOpenCollaboration={openCollaborationDialog}
        onExportFile={onExportFile}
        onOpenImport={openImportDialog}
        onOpenSearch={openSearchPanel}
        onOpenTemplate={openTemplateModal}
        onOpenWorkspaceImport={openWorkspacePanelModal}
        onOpenThemeSelector={openThemeSelector}
        onOpenWelcome={openWelcomeScreen}
        theme={theme}
        autoSaveEnabled={autoSaveEnabled}
      />

      {showSettingsCenter && (
        <SettingsCenter
          aiConfig={aiConfig}
          theme={theme}
          autoSaveEnabled={autoSaveEnabled}
          language={language}
          onSaveAIConfig={async (config) => {
            setAiConfig(config)
            await unifiedStorage.set('ai-config', config)
          }}
          onToggleTheme={onToggleTheme}
          onToggleAutoSave={async () => {
            const newValue = !autoSaveEnabled
            setAutoSaveEnabled(newValue)
            await unifiedStorage.set('settings', { autosave: newValue }, { layer: StorageLayer.LOCAL })
          }}
          onChangeLanguage={(lang) => {
            setLanguage(lang)
          }}
          onClearLocalData={async () => {
            const ok = await requestConfirm({
              title: '清理本地数据',
              message: '将清除浏览器中的项目缓存、设置与 IndexedDB。云端账号数据不受影响。',
              confirmText: '清理',
              tone: 'danger',
            })
            if (!ok) return
            try {
              localStorage.clear()
              indexedDB.deleteDatabase('aide-unified-storage')
              notify('success', '本地数据已清理', '建议刷新页面后重新登录。')
            } catch {
              notify('error', '清理失败', '请尝试在浏览器设置中手动清除站点数据。')
            }
          }}
          onResetDefaults={async () => {
            const ok = await requestConfirm({
              title: '重置默认设置',
              message: '将恢复主题、自动保存与 AI 配置为默认值（不删除工作区文件列表）。',
              confirmText: '重置',
            })
            if (!ok) return
            setTheme('vs-dark')
            setAutoSaveEnabled(true)
            const defaultAi = {
              provider: 'openai' as const,
              apiKey: '',
              model: modelOptions.openai.models[0],
              endpoint: '',
            }
            setAiConfig(defaultAi)
            await unifiedStorage.set('ai-config', defaultAi)
            await unifiedStorage.set('theme', 'vs-dark', { layer: StorageLayer.LOCAL })
            await unifiedStorage.set('settings', { autosave: true }, { layer: StorageLayer.LOCAL })
            notify('success', '已恢复默认设置')
          }}
          projectRulesPreview={projectRulesPreview}
          onEditProjectRules={() => {
            const index = files.findIndex((file) => file.name === PROJECT_RULES_PATH)
            if (index >= 0) {
              setActiveFile(index)
            } else {
              setFiles([
                ...files,
                {
                  name: PROJECT_RULES_PATH,
                  content: DEFAULT_PROJECT_RULES_TEMPLATE,
                  language: 'markdown',
                },
              ])
              setActiveFile(files.length)
            }
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          onClose={closeSettingsPanel}
        />
      )}

      {showWorkspaceManager && (
        <WorkspaceManager
          currentFiles={files}
          currentSettings={{
            theme,
            autoSave: autoSaveEnabled,
            language,
            aiProvider: aiConfig.provider,
            aiModel: aiConfig.model,
          }}
          onLoadWorkspace={(loadedFiles, settings) => {
            setFiles(loadedFiles)
            setActiveFile(0)
            if (settings.theme) setTheme(settings.theme as EditorTheme)
            if (settings.autoSave !== undefined) setAutoSaveEnabled(settings.autoSave)
            notify('success', '工作区已加载', `共 ${loadedFiles.length} 个文件。`)
          }}
          notify={notify}
          requestConfirm={requestConfirm}
          onClose={() => setShowWorkspaceManager(false)}
        />
      )}

      {showWorkspacePanel && (
        <WorkspacePanel
          onClose={() => setShowWorkspacePanel(false)}
          onFilesChange={(workspaceFiles) => {
            if (workspaceFiles.length > 0) {
              setFiles(workspaceFiles)
              setActiveFile(0)
            }
          }}
          currentFiles={files}
          notify={notify}
          requestConfirm={requestConfirm}
        />
      )}

      {showThemeSelector && (
        <ThemeSelector
          currentTheme={theme}
          onChangeTheme={async (newTheme) => {
            setTheme(newTheme as EditorTheme)
            await unifiedStorage.set('theme', newTheme, { layer: StorageLayer.LOCAL })
          }}
          onClose={() => setShowThemeSelector(false)}
        />
      )}

      <StatusBar
        currentFileName={files[activeFile]?.name || 'Untitled'}
        currentFileLanguage={files[activeFile]?.language || 'plaintext'}
        lineCount={files[activeFile]?.content.split('\n').length || 0}
        charCount={files[activeFile]?.content.length || 0}
        diagnosticCount={diagnosticCount}
        isWebContainerReady={isWebContainerReady}
        aiProvider={aiConfig.provider}
        isAIConnected={!!aiConfig.apiKey}
        autoSaveEnabled={autoSaveEnabled}
        language={language}
        onOpenSettings={openSettingsPanel}
        onOpenAISettings={() => setShowAISettings(true)}
        onToggleAutoSave={() => {
          const nextValue = !autoSaveEnabled
          setAutoSaveEnabled(nextValue)
          notify('success', nextValue ? '自动保存已开启' : '自动保存已关闭')
        }}
        gitBranch={gitBranch}
        gitModified={gitModified}
        onOpenGitPanel={openGitPanel}
      />

      {showWelcome && (
        <WelcomeScreen
          recentProjects={recentProjects}
          onNewProject={() => closeWelcomeAnd(openTemplateModal)}
          onOpenProject={() => closeWelcomeAnd(openWorkspaceManagerModal)}
          onOpenWorkspace={(workspaceId) => {
            void onOpenRecentWorkspace(workspaceId)
          }}
          onOpenSettings={() => closeWelcomeAnd(openSettingsPanel)}
          onOpenAIChat={() => closeWelcomeAnd(openChatPanel)}
          onOpenTerminal={() => closeWelcomeAnd(openTerminalPanel)}
          onOpenGit={() => closeWelcomeAnd(openGitPanel)}
          onOpenCollaboration={() => closeWelcomeAnd(openCollaborationDialog)}
        />
      )}
    </>
  )
}
