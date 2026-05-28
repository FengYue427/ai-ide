import DropZone from '../components/DropZone'
import StatusBar from '../components/StatusBar'
import WorkspacePanel from '../components/WorkspacePanel'
import { modelOptions } from '../services/aiService'
import { unifiedStorage, StorageLayer } from '../services/unifiedStorage'
import { markWorkspaceHydrated } from '../services/workspaceSession'
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
  getDefaultProjectRulesTemplate,
  extractProjectRules,
  PROJECT_RULES_PATH,
} from '../services/projectRulesService'
import {
  collectTasksSources,
  extractProjectTasks,
  getDefaultProjectTasksTemplate,
  parseProjectTasks,
  PROJECT_TASKS_PATH,
} from '../services/projectTasksService'
import { workspaceContextService } from '../services/workspaceContextService'
import { buildSpecTemplateFiles, SPECS_ROOT } from '../services/specsService'
import { buildPlanExecutionPrompt } from '../services/planExecutionService'
import { buildPlanCatalog } from '../services/planCatalogService'
import { appendPlanStepsToSpecTasks, findLatestSpecTasksPath } from '../services/planSpecsBridgeService'
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
  const { language, setLanguage, t } = useI18n()
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
  const setQueuedChatPrompt = useIDEStore((s) => s.setQueuedChatPrompt)
  const setQueuedSpecBackfill = useIDEStore((s) => s.setQueuedSpecBackfill)
  const setQueuedPlanBackfill = useIDEStore((s) => s.setQueuedPlanBackfill)
  const setQueuedPlanExecutions = useIDEStore((s) => s.setQueuedPlanExecutions)

  const projectRulesPreview = extractProjectRules(
    collectRulesSources(
      files,
      workspaceContextService.getAllFiles().map((file) => ({ path: file.path, content: file.content })),
    ),
  )
  const projectTasks = extractProjectTasks(
    collectTasksSources(
      files,
      workspaceContextService.getAllFiles().map((file) => ({ path: file.path, content: file.content })),
    ),
  )
  const specTaskItems = files
    .filter((file) => /^\.aide\/specs\/[^/]+\/tasks\.md$/i.test(file.name))
    .flatMap((file) =>
      parseProjectTasks(file.content).map((task) => ({
        path: file.name,
        text: task.text,
        done: task.done,
        line: task.line,
      })),
    )
  const planItems = buildPlanCatalog(files)
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

  const registryPanels = [
    {
      id: 'template',
      show: showTemplateModal,
      render: () => <TemplateModal onSelect={onApplyTemplate} onClose={() => setShowTemplateModal(false)} />,
    },
    {
      id: 'share',
      show: showShareModal,
      render: () => <ShareModal files={files} onImport={onImportFiles} onClose={() => setShowShareModal(false)} />,
    },
    {
      id: 'ai-settings',
      show: showAISettings,
      render: () => <AISettingsModal config={aiConfig} onSave={onSaveAISettings} onClose={() => setShowAISettings(false)} />,
    },
    {
      id: 'subscription',
      show: showSubscriptionModal,
      render: () => <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} currentPlan={currentPlan} />,
    },
    {
      id: 'import',
      show: showImportModal,
      render: () => <ImportModal onImport={onImportFiles} onClose={() => setShowImportModal(false)} />,
    },
    {
      id: 'collaboration',
      show: showCollaboration,
      render: () => <CollaborationPanel onClose={() => setShowCollaboration(false)} />,
    },
    {
      id: 'plugin-manager',
      show: showPluginManager,
      render: () => <PluginManager onClose={() => setShowPluginManager(false)} />,
    },
    {
      id: 'drop-zone',
      show: showDropZone,
      render: () => <DropZone onFilesDrop={onImportFiles} onClose={() => setShowDropZone(false)} />,
    },
  ]

  return (
    <>
      {registryPanels.map((panel) => (panel.show ? <div key={panel.id}>{panel.render()}</div> : null))}

      {showAuthModal && (
        <AuthModal
          onAuthenticated={(user) => {
            setCurrentUser(user)
            setShowAuthModal(false)
            notify('success', t('notify.signedIn', { email: user.email }))
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

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
              title: t('confirm.clearData.title'),
              message: t('confirm.clearData.message'),
              confirmText: t('confirm.clearData.confirm'),
              tone: 'danger',
            })
            if (!ok) return
            try {
              localStorage.clear()
              indexedDB.deleteDatabase('aide-unified-storage')
              notify('success', t('notify.localCleared'), t('notify.localClearedDetail'))
            } catch {
              notify('error', t('notify.clearFailed'), t('notify.clearFailedDetail'))
            }
          }}
          onResetDefaults={async () => {
            const ok = await requestConfirm({
              title: t('confirm.reset.title'),
              message: t('confirm.reset.message'),
              confirmText: t('confirm.reset.confirm'),
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
            notify('success', t('notify.defaultsRestored'))
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
                  content: getDefaultProjectRulesTemplate(language),
                  language: 'markdown',
                },
              ])
              setActiveFile(files.length)
            }
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          projectTasks={projectTasks}
          onEditProjectTasks={() => {
            const index = files.findIndex((file) => file.name === PROJECT_TASKS_PATH)
            if (index >= 0) {
              setActiveFile(index)
            } else {
              setFiles([
                ...files,
                {
                  name: PROJECT_TASKS_PATH,
                  content: getDefaultProjectTasksTemplate(language),
                  language: 'markdown',
                },
              ])
              setActiveFile(files.length)
            }
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          onCreateSpec={(name) => {
            const templates = buildSpecTemplateFiles(name)
            const nextFiles = [...files]
            for (const item of templates) {
              const existingIndex = nextFiles.findIndex((file) => file.name === item.path)
              if (existingIndex >= 0) {
                nextFiles[existingIndex] = { ...nextFiles[existingIndex], content: item.content, language: 'markdown' }
              } else {
                nextFiles.push({ name: item.path, content: item.content, language: 'markdown' })
              }
            }
            setFiles(nextFiles)
            const firstSpecIndex = nextFiles.findIndex((file) => file.name === templates[0]?.path)
            if (firstSpecIndex >= 0) setActiveFile(firstSpecIndex)
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          onOpenSpecsRoot={() => {
            const targetIndex = files.findIndex((file) => file.name.startsWith(`${SPECS_ROOT}/`))
            if (targetIndex >= 0) {
              setActiveFile(targetIndex)
              setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
              closeSettingsPanel()
            }
          }}
          specTasks={specTaskItems}
          onMarkSpecTaskDone={(path, line) => {
            setFiles((prev) =>
              prev.map((file) => {
                if (file.name !== path) return file
                const lines = file.content.split(/\r?\n/)
                const index = line - 1
                if (index < 0 || index >= lines.length) return file
                lines[index] = lines[index].replace(/^(\s*-\s*)\[( |x|X)\]/, '$1[x]')
                return { ...file, content: lines.join('\n') }
              }),
            )
            const targetIndex = files.findIndex((file) => file.name === path)
            if (targetIndex >= 0) {
              setActiveFile(targetIndex)
              setEditorTarget({ line, column: 1, nonce: Date.now() })
            }
          }}
          onRunSpecTask={(path, text) => {
            const prompt = `请执行这个规格任务，并说明改动文件与验证步骤：\n\n[${path}] ${text}`
            const acceptancePath = path.replace(/[\\/]tasks\.md$/i, '/acceptance.md')
            setQueuedChatPrompt(prompt)
            setQueuedSpecBackfill({
              taskPath: path,
              taskText: text,
              specAcceptancePath: acceptancePath,
            })
            closeSettingsPanel()
            openChatPanel()
          }}
          planItems={planItems}
          onOpenPlan={(path) => {
            const targetIndex = files.findIndex((file) => file.name === path)
            if (targetIndex < 0) return
            setActiveFile(targetIndex)
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          onRunPlan={(path, steps) => {
            const file = files.find((f) => f.name === path)
            if (!file) return
            if (steps.length === 0) {
              notify('error', '无法执行', '该计划里没有可执行的未完成步骤（- [ ]）')
              return
            }
            const queue = steps.map((step) => ({
              prompt: buildPlanExecutionPrompt(step),
              backfill: { planPath: path, stepText: step },
            }))
            setQueuedPlanExecutions(queue.slice(1))
            setQueuedPlanBackfill(queue[0].backfill)
            setQueuedChatPrompt(queue[0].prompt)
            closeSettingsPanel()
            openChatPanel()
          }}
          onMapPlanToSpec={(path, steps) => {
            const targetSpecTasks = findLatestSpecTasksPath(files)
            if (!targetSpecTasks) {
              notify('error', '映射失败', '未找到 Specs tasks 文件，请先创建一个 Spec')
              return
            }
            const result = appendPlanStepsToSpecTasks(files, targetSpecTasks, steps)
            if (result.added === 0) {
              notify('info', '无需映射', '这些步骤已存在于 Spec tasks')
              return
            }
            setFiles(result.files)
            const index = result.files.findIndex((file) => file.name === targetSpecTasks)
            if (index >= 0) {
              setActiveFile(index)
              setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            }
            notify('success', '映射完成', `[${path}] 已追加 ${result.added} 条到 ${targetSpecTasks}`)
          }}
          onDeletePlan={(path) => {
            void (async () => {
              const ok = await requestConfirm({
                title: '删除计划？',
                message: `将从工作区移除：${path}`,
                confirmText: '删除',
                tone: 'danger',
              })
              if (!ok) return
              setFiles((prev) => prev.filter((f) => f.name !== path))
              notify('success', '已删除', path)
            })()
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
            markWorkspaceHydrated()
            if (settings.theme) setTheme(settings.theme as EditorTheme)
            if (settings.autoSave !== undefined) setAutoSaveEnabled(settings.autoSave)
            notify('success', t('notify.workspaceLoaded'), t('notify.workspaceLoadedDetail', { count: loadedFiles.length }))
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
          notify('success', nextValue ? t('notify.autosaveOn') : t('notify.autosaveOff'))
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
