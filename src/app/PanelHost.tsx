import { useCallback } from 'react'
import DropZone from '../components/DropZone'
import StatusBar from '../components/StatusBar'
import WorkspacePanel from '../components/WorkspacePanel'
import { modelOptions } from '../services/aiService'
import { unifiedStorage, StorageLayer } from '../services/unifiedStorage'
import { markWorkspaceHydrated } from '../services/workspaceSession'
import { useIDEStore, type EditorTheme } from '../store/ideStore'
import type { RunNpmScriptHandler } from '../lib/npmScriptRun'
import {
  AISettingsModal,
  AuthModal,
  CollaborationPanel,
  CommandPalette,
  DiffViewer,
  ImportModal,
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
import {
  preparePlanStepsForBackgroundJobs,
  queuePlanStepsAsBackgroundJobs,
} from '../services/planBackgroundJobsService'
import { listBackgroundJobs } from '../services/backgroundJobsApiService'
import { isBackgroundAgentEnabled } from '../lib/backgroundAgentFeatures'
import { buildPlanCatalog } from '../services/planCatalogService'
import { buildReportCatalog, findLatestReportPath } from '../services/reportCatalogService'
import {
  buildReportsZipBlob,
  downloadBlob,
  pickReportPathsToPrune,
  removeReportsFromFiles,
} from '../services/reportArchiveService'
import { buildSpecCatalog } from '../services/specCatalogService'
import {
  buildPlanLinkCountMap,
  findSpecTasksPathForPlanStep,
  listPlanLinksForSpec,
  readPlanSpecLinks,
  summarizeSpecSources,
  upsertPlanSpecLinksFile,
} from '../services/planSpecLinkService'
import { markPlanStepDone } from '../services/planStepCompletionService'
import { offerSyncAideAfterPlanWrite, runAideWorkspaceSyncWithNotify, type PlanHostTranslateFn } from '../services/planAideSyncPromptService'
import {
  buildQueueRestoreFromReport,
  mergePlanRestoreItems,
  mergeSpecRestoreItems,
} from '../services/queueReportRestoreService'
import { appendPlanStepsToSpecTasks, findLatestSpecTasksPath, listSpecTasksPaths } from '../services/planSpecsBridgeService'
import { duplicatePlanFile } from '../services/planDuplicateService'
import { createPlanFromTemplate, listPlanTemplates } from '../services/planTemplateService'
import {
  buildQueueRestorePreview,
  formatQueueRestorePreview,
  hasQueueRestoreItems,
} from '../services/queueReportRestorePreviewService'
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
  onRunNpmScript: RunNpmScriptHandler
  onStartDebug?: () => void
  onStopDebug?: () => void
  onDebugContinue?: () => void
  onDebugStepOver?: () => void
  onDebugStepInto?: () => void
  onDebugStepOut?: () => void
  onToggleTheme: () => void
  closeCommandPalette: () => void
  closeSettingsPanel: () => void
  openNewFileInput: () => void
  openSettingsPanel: () => void
  openGitPanel: () => void
  openShareDialog: () => void
  openChatPanel: () => void
  openBackgroundJobsPanel?: () => void
  openSnippetPanel: () => void
  openTerminalPanel: () => void
  openScriptsPanel: () => void
  openTasksPanel: () => void
  openDebugPanel: () => void
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
  openRegisterDialog: () => void
  onOpenRecentWorkspace: (workspaceId: string) => void | Promise<void>
  onTestsGenerated: (fileName: string, content: string) => void
  isRunning: boolean
  output: string[]
  isWebContainerReady: boolean
  gitBranch?: string
  gitModified?: number
  gitUnstaged?: number
  gitStageAllDisabled?: boolean
  onStageAll?: () => void | Promise<void>
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
  onStartDebug,
  onStopDebug,
  onDebugContinue,
  onDebugStepOver,
  onDebugStepInto,
  onDebugStepOut,
  onToggleTheme,
  closeCommandPalette,
  closeSettingsPanel,
  openNewFileInput,
  openSettingsPanel,
  openGitPanel,
  openShareDialog,
  openChatPanel,
  openBackgroundJobsPanel,
  openSnippetPanel,
  openTerminalPanel,
  openScriptsPanel,
  openTasksPanel,
  openDebugPanel,
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
  openRegisterDialog,
  onOpenRecentWorkspace,
  onTestsGenerated: _onTestsGenerated,
  isRunning: _isRunning,
  output: _output,
  isWebContainerReady,
  gitBranch,
  gitModified = 0,
  gitUnstaged = 0,
  gitStageAllDisabled = false,
  onStageAll,
}: PanelHostProps) {
  const { language, setLanguage, t } = useI18n()
  const planT: PlanHostTranslateFn = useCallback(
    (key, params) => (t as PlanHostTranslateFn)(key, params),
    [t],
  )
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const activeEditorSurface = useIDEStore((s) => s.activeEditorSurface)
  const gitDiffTabs = useIDEStore((s) => s.gitDiffTabs)
  const activeGitDiffTab = useIDEStore((s) => s.activeGitDiffTab)
  const activeFileTab = activeEditorSurface === 'file' ? files[activeFile] : null
  const activeDiffTab = activeEditorSurface === 'git-diff' ? gitDiffTabs[activeGitDiffTab] : null
  const activeTabMeta = activeDiffTab ?? activeFileTab
  const theme = useIDEStore((s) => s.theme)
  const aiConfig = useIDEStore((s) => s.aiConfig)
  const autoSaveEnabled = useIDEStore((s) => s.autoSaveEnabled)
  const formatOnSaveEnabled = useIDEStore((s) => s.formatOnSaveEnabled)
  const diffContent = useIDEStore((s) => s.diffContent)
  const diagnosticCount = useIDEStore((s) => s.diagnosticCount)
  const diagnosticErrors = useIDEStore((s) => s.diagnosticErrors)
  const diagnosticWarnings = useIDEStore((s) => s.diagnosticWarnings)
  const recentProjects = useIDEStore((s) => s.recentProjects)
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const currentUser = useIDEStore((s) => s.currentUser)
  const showTemplateModal = useIDEStore((s) => s.showTemplateModal)
  const showShareModal = useIDEStore((s) => s.showShareModal)
  const showAISettings = useIDEStore((s) => s.showAISettings)
  const showAuthModal = useIDEStore((s) => s.showAuthModal)
  const authModalTab = useIDEStore((s) => s.authModalTab)
  const showSubscriptionModal = useIDEStore((s) => s.showSubscriptionModal)
  const showImportModal = useIDEStore((s) => s.showImportModal)
  const showCollaboration = useIDEStore((s) => s.showCollaboration)
  const showPluginManager = useIDEStore((s) => s.showPluginManager)
  const showDropZone = useIDEStore((s) => s.showDropZone)
  const showDiff = useIDEStore((s) => s.showDiff)
  const showAgentApplyModal = useIDEStore((s) => s.showAgentApplyModal)
  const showSnippetLibrary = useIDEStore((s) => s.showSnippetLibrary)
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
  const setQueuedSpecExecutions = useIDEStore((s) => s.setQueuedSpecExecutions)
  const queuedSpecExecutions = useIDEStore((s) => s.queuedSpecExecutions)
  const setQueuedPlanBackfill = useIDEStore((s) => s.setQueuedPlanBackfill)
  const setQueuedPlanExecutions = useIDEStore((s) => s.setQueuedPlanExecutions)
  const queuedPlanBackfill = useIDEStore((s) => s.queuedPlanBackfill)
  const queuedPlanExecutions = useIDEStore((s) => s.queuedPlanExecutions)
  const queuedSpecBackfill = useIDEStore((s) => s.queuedSpecBackfill)
  const queuedChatPrompt = useIDEStore((s) => s.queuedChatPrompt)

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
  const planItems = buildPlanCatalog(files)
  const planTemplates = listPlanTemplates(files)
  const reportItems = buildReportCatalog(files)
  const specCatalogItems = buildSpecCatalog(files)
  const planSpecLinks = readPlanSpecLinks(files)
  const planLinkCounts = buildPlanLinkCountMap(planSpecLinks)
  const specLinkCounts = planSpecLinks.reduce<Record<string, number>>((acc, link) => {
    acc[link.specTasksPath] = (acc[link.specTasksPath] ?? 0) + 1
    return acc
  }, {})
  const specSourceSummaries = specCatalogItems.reduce<Record<string, string[]>>((acc, item) => {
    acc[item.tasksPath] = summarizeSpecSources(planSpecLinks, item.tasksPath)
    return acc
  }, {})
  const specPlanLinks = specCatalogItems.reduce<Record<string, (typeof planSpecLinks)[number][]>>((acc, item) => {
    acc[item.tasksPath] = listPlanLinksForSpec(planSpecLinks, item.tasksPath)
    return acc
  }, {})
  const latestReportAt = reportItems
    .map((item) => item.generatedAt)
    .filter((item): item is string => !!item)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null
  const specTaskPaths = listSpecTasksPaths(files)
  const syncAideWorkspace = useCallback(
    (fileList: typeof files) => runAideWorkspaceSyncWithNotify(fileList, notify, planT),
    [notify, planT],
  )
  const promptSyncAideAfterPlanWrite = useCallback(
    (fileList: typeof files) => offerSyncAideAfterPlanWrite(fileList, requestConfirm, notify, planT),
    [notify, planT, requestConfirm],
  )
  const setTheme = useIDEStore((s) => s.setTheme)
  const setAiConfig = useIDEStore((s) => s.setAiConfig)
  const setAutoSaveEnabled = useIDEStore((s) => s.setAutoSaveEnabled)
  const setFormatOnSaveEnabled = useIDEStore((s) => s.setFormatOnSaveEnabled)
  const requestFormatDocument = useIDEStore((s) => s.requestFormatDocument)
  const requestGoToDefinition = useIDEStore((s) => s.requestGoToDefinition)
  const requestGoToReferences = useIDEStore((s) => s.requestGoToReferences)
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
  const setShowSnippetLibrary = useIDEStore((s) => s.setShowSnippetLibrary)
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
          initialTab={authModalTab}
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

      {showAgentApplyModal && <AgentApplyModal notify={notify} />}

      {showSnippetLibrary && (
        <SnippetLibrary
          onInsert={(code) => {
            if (!activeFileTab) return
            const next = [...files]
            next[activeFile] = { ...activeFileTab, content: activeFileTab.content + '\n' + code }
            setFiles(next)
          }}
          currentLanguage={activeFileTab?.language}
          notify={notify}
          requestConfirm={requestConfirm}
          onClose={() => setShowSnippetLibrary(false)}
        />
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
        onStageAll={onStageAll ? () => void onStageAll() : undefined}
        gitStageAllDisabled={gitStageAllDisabled}
        onOpenShare={openShareDialog}
        onOpenAIChat={openChatPanel}
        onOpenSnippetLibrary={openSnippetPanel}
        onOpenTerminal={openTerminalPanel}
        onOpenScripts={openScriptsPanel}
        onOpenTasks={openTasksPanel}
        onOpenPreview={openPreviewPanel}
        onOpenCodeReview={openCodeReviewPanel}
        onOpenPerformance={openPerformanceDialog}
        onOpenPluginManager={openPluginDialog}
        onExportZip={onExportZip}
        onToggleTheme={onToggleTheme}
        onToggleAutoSave={() => setAutoSaveEnabled(!autoSaveEnabled)}
        onFormatDocument={() => requestFormatDocument()}
        onGoToDefinition={() => requestGoToDefinition()}
        onGoToReferences={() => requestGoToReferences()}
        onOpenCollaboration={openCollaborationDialog}
        onExportFile={onExportFile}
        onOpenImport={openImportDialog}
        onOpenSearch={openSearchPanel}
        onOpenTemplate={openTemplateModal}
        onOpenWorkspaceImport={openWorkspacePanelModal}
        onOpenThemeSelector={openThemeSelector}
        onOpenWelcome={openWelcomeScreen}
        onOpenDebug={openDebugPanel}
        onStartDebug={onStartDebug}
        onStopDebug={onStopDebug}
        onDebugContinue={onDebugContinue}
        onDebugStepOver={onDebugStepOver}
        onDebugStepInto={onDebugStepInto}
        onDebugStepOut={onDebugStepOut}
        theme={theme}
        autoSaveEnabled={autoSaveEnabled}
      />

      {showSettingsCenter && (
        <SettingsCenter
          aiConfig={aiConfig}
          theme={theme}
          autoSaveEnabled={autoSaveEnabled}
          formatOnSaveEnabled={formatOnSaveEnabled}
          language={language}
          onSaveAIConfig={async (config) => {
            setAiConfig(config)
            await unifiedStorage.set('ai-config', config)
          }}
          onToggleTheme={onToggleTheme}
          onToggleAutoSave={async () => {
            const newValue = !autoSaveEnabled
            setAutoSaveEnabled(newValue)
            const existing = await unifiedStorage.get<Record<string, unknown>>('settings', {})
            await unifiedStorage.set(
              'settings',
              { ...existing, autosave: newValue },
              { layer: StorageLayer.LOCAL },
            )
          }}
          onToggleFormatOnSave={async () => {
            const newValue = !formatOnSaveEnabled
            setFormatOnSaveEnabled(newValue)
            const existing = await unifiedStorage.get<Record<string, unknown>>('settings', {})
            await unifiedStorage.set(
              'settings',
              { ...existing, formatOnSave: newValue },
              { layer: StorageLayer.LOCAL },
            )
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
            setFormatOnSaveEnabled(false)
            const defaultAi = {
              provider: 'deepseek' as const,
              apiKey: '',
              model: modelOptions.deepseek.models[0],
              endpoint: '',
              keyMode: 'platform' as const,
            }
            setAiConfig(defaultAi)
            await unifiedStorage.set('ai-config', defaultAi)
            await unifiedStorage.set('theme', 'vs-dark', { layer: StorageLayer.LOCAL })
            await unifiedStorage.set('settings', { autosave: true, formatOnSave: false }, { layer: StorageLayer.LOCAL })
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
          onOpenTasksPanel={() => {
            closeSettingsPanel()
            openTasksPanel()
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
          specCatalogItems={specCatalogItems}
          specSourceSummaries={specSourceSummaries}
          specPlanLinks={specPlanLinks}
          specLinkCounts={specLinkCounts}
          onOpenLinkedPlan={(planPath, stepLine) => {
            const targetIndex = files.findIndex((file) => file.name === planPath)
            if (targetIndex < 0) return
            setActiveFile(targetIndex)
            setEditorTarget({ line: stepLine ?? 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          onSyncAideToWorkspace={() => {
            void syncAideWorkspace(files)
          }}
          planOverview={{
            planCount: planItems.length,
            openSteps: planItems.reduce((sum, item) => sum + item.uncheckedSteps, 0),
            planQueueCount: queuedPlanExecutions.length + (queuedPlanBackfill ? 1 : 0),
            specQueueCount: queuedSpecExecutions.length + (queuedSpecBackfill ? 1 : 0),
            isQueueRunning: !!(
              queuedChatPrompt ||
              queuedPlanBackfill ||
              queuedSpecBackfill ||
              queuedPlanExecutions.length > 0 ||
              queuedSpecExecutions.length > 0
            ),
            latestReportAt,
          }}
          onOpenSpecTasks={(tasksPath) => {
            const targetIndex = files.findIndex((file) => file.name === tasksPath)
            if (targetIndex < 0) return
            setActiveFile(targetIndex)
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          onOpenSpecAcceptance={(tasksPath) => {
            const acceptancePath = tasksPath.replace(/[\\/]tasks\.md$/i, '/acceptance.md')
            const targetIndex = files.findIndex((file) => file.name === acceptancePath)
            if (targetIndex < 0) return
            setActiveFile(targetIndex)
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          onRunFirstOpenSpecTask={(tasksPath) => {
            const file = files.find((f) => f.name === tasksPath)
            if (!file) return
            const first = parseProjectTasks(file.content).find((t) => !t.done)
            if (!first) {
              notify('info', t('spec.host.noOpenTask.title'), t('spec.host.noOpenTask.detail'))
              return
            }
            const prompt = `请执行这个规格任务，并说明改动文件与验证步骤：\n\n[${tasksPath}] ${first.text}`
            const acceptancePath = tasksPath.replace(/[\\/]tasks\.md$/i, '/acceptance.md')
            setQueuedChatPrompt(prompt)
            setQueuedSpecBackfill({
              taskPath: tasksPath,
              taskText: first.text,
              specAcceptancePath: acceptancePath,
            })
            closeSettingsPanel()
            openChatPanel()
          }}
          planItems={planItems}
          planLinkCounts={planLinkCounts}
          planTemplates={planTemplates}
          onCreatePlanFromTemplate={(templateId, planTitle) => {
            const result = createPlanFromTemplate(files, templateId, planTitle)
            if (!result) {
              notify('error', t('plan.host.createFailed.title'), t('plan.host.createFailed.detail'))
              return
            }
            setFiles(result.files)
            setActiveFile(result.index)
            markWorkspaceHydrated()
            closeSettingsPanel()
            notify('success', t('plan.host.created.title'), t('plan.host.created.detail', { path: result.path }))
            void promptSyncAideAfterPlanWrite(result.files)
          }}
          specTaskPaths={specTaskPaths}
          onOpenPlan={(path) => {
            const targetIndex = files.findIndex((file) => file.name === path)
            if (targetIndex < 0) return
            setActiveFile(targetIndex)
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          getLinkedSpecPath={(planPath, stepText) => findSpecTasksPathForPlanStep(planSpecLinks, planPath, stepText)}
          onOpenLinkedSpec={(specTasksPath) => {
            const targetIndex = files.findIndex((file) => file.name === specTasksPath)
            if (targetIndex < 0) return
            setActiveFile(targetIndex)
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          onMarkPlanStepsDone={(path, steps) => {
            if (steps.length === 0) return
            let nextFiles = files
            for (const step of steps) {
              nextFiles = markPlanStepDone(nextFiles, path, step)
            }
            setFiles(nextFiles)
            markWorkspaceHydrated()
            notify('success', t('plan.host.markDone.title'), t('plan.host.markDone.detail', { path, count: steps.length }))
          }}
          onDuplicatePlan={(path) => {
            const result = duplicatePlanFile(files, path)
            if (!result) {
              notify('error', t('plan.host.duplicateFailed.title'), t('plan.host.duplicateFailed.detail'))
              return
            }
            setFiles(result.files)
            setActiveFile(result.index)
            markWorkspaceHydrated()
            notify('success', t('plan.host.duplicated.title'), t('plan.host.duplicated.detail', { path: result.path }))
            void promptSyncAideAfterPlanWrite(result.files)
          }}
          onRunPlan={(path, steps) => {
            const file = files.find((f) => f.name === path)
            if (!file) return
            if (steps.length === 0) {
              notify('error', t('plan.host.runNoSteps.title'), t('plan.host.runNoSteps.detail'))
              return
            }
            const existing = new Set<string>()
            if (queuedPlanBackfill?.planPath === path) existing.add(queuedPlanBackfill.stepText.trim().toLowerCase())
            queuedPlanExecutions.forEach((item) => {
              if (item.backfill.planPath === path) existing.add(item.backfill.stepText.trim().toLowerCase())
            })
            const deduped = steps.filter((step, index, arr) => {
              const normalized = step.text.trim().toLowerCase()
              return (
                normalized &&
                arr.findIndex((s) => s.text.trim().toLowerCase() === normalized) === index &&
                !existing.has(normalized)
              )
            })
            if (deduped.length === 0) {
              notify('info', t('plan.host.runAlreadyQueued.title'), t('plan.host.runAlreadyQueued.detail'))
              return
            }
            void (async () => {
              const preview = deduped.slice(0, 8).map((s) => `- ${s.text}`).join('\n')
              const ok = await requestConfirm({
                title: t('plan.host.runConfirm.title'),
                message: t('plan.host.runConfirm.message', {
                  path,
                  count: deduped.length,
                  preview,
                  more: deduped.length > 8 ? t('plan.host.runConfirm.more') : '',
                }),
                confirmText: t('plan.host.runConfirm.confirm'),
              })
              if (!ok) return

              const queue = deduped.map((step) => ({
                prompt: buildPlanExecutionPrompt(step.text),
                backfill: { planPath: path, stepText: step.text, stepLine: step.line },
              }))
              setQueuedPlanExecutions(queue.slice(1))
              setQueuedPlanBackfill(queue[0].backfill)
              setQueuedChatPrompt(queue[0].prompt)
              closeSettingsPanel()
              openChatPanel()
            })()
          }}
          onRunPlanInBackground={
            isBackgroundAgentEnabled() && openBackgroundJobsPanel
              ? (path, steps) => {
                  if (!currentUser) {
                    notify('error', t('backgroundJobs.loginRequired'))
                    return
                  }
                  if (steps.length === 0) {
                    notify('error', t('plan.host.runNoSteps.title'), t('plan.host.runNoSteps.detail'))
                    return
                  }
                  void (async () => {
                    const { jobs: existing } = await listBackgroundJobs(100)
                    const prepared = preparePlanStepsForBackgroundJobs(path, steps, existing)
                    if (prepared.steps.length === 0) {
                      notify(
                        'info',
                        t('plan.host.runBackgroundAlreadyQueued.title'),
                        t('plan.host.runBackgroundAlreadyQueued.detail'),
                      )
                      return
                    }

                    const preview = prepared.steps
                      .slice(0, 8)
                      .map((s) => `- ${s.text}`)
                      .join('\n')
                    const ok = await requestConfirm({
                      title: t('plan.host.runBackgroundConfirm.title'),
                      message: t('plan.host.runBackgroundConfirm.message', {
                        path,
                        count: prepared.steps.length,
                        preview,
                        more: prepared.steps.length > 8 ? t('plan.host.runConfirm.more') : '',
                      }),
                      confirmText: t('plan.host.runBackgroundConfirm.confirm'),
                    })
                    if (!ok) return

                    const queued = await queuePlanStepsAsBackgroundJobs(path, steps, {
                      t,
                      existingJobs: existing,
                    })

                    closeSettingsPanel()
                    openBackgroundJobsPanel()
                    if (queued.created > 0) {
                      notify(
                        'success',
                        t('plan.host.runBackgroundQueued.title'),
                        t('plan.host.runBackgroundQueued.detail', {
                          count: queued.created,
                          path,
                        }),
                      )
                    }
                    if (queued.skippedDuplicate > 0) {
                      notify(
                        'info',
                        t('plan.host.runBackgroundSkipped.title'),
                        t('plan.host.runBackgroundSkipped.detail', { count: queued.skippedDuplicate }),
                      )
                    }
                    if (queued.error) {
                      notify('error', t('chat.backgroundRun.failed'), queued.error)
                    }
                  })()
                }
              : undefined
          }
          onMapPlanToSpec={(path, steps, targetSpecPath) => {
            const targetSpecTasks = targetSpecPath || findLatestSpecTasksPath(files)
            if (!targetSpecTasks) {
              notify('error', t('plan.host.mapFailed.title'), t('plan.host.mapFailed.detail'))
              return
            }
            const result = appendPlanStepsToSpecTasks(files, targetSpecTasks, steps.map((s) => s.text))
            if (result.added === 0) {
              notify('info', t('plan.host.mapNothing.title'), t('plan.host.mapNothing.detail'))
              return
            }
            const linkInput = result.addedSteps.map((taskText) => {
              const source = steps.find((step) => step.text.trim().toLowerCase() === taskText.trim().toLowerCase())
              return {
                planPath: path,
                planStepText: source?.text ?? taskText,
                planStepLine: source?.line,
                specTasksPath: targetSpecTasks,
                specTaskText: taskText,
              }
            })
            const nextFiles = upsertPlanSpecLinksFile(result.files, linkInput)
            setFiles(nextFiles)
            const index = nextFiles.findIndex((file) => file.name === targetSpecTasks)
            if (index >= 0) {
              setActiveFile(index)
              setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            }
            notify(
              'success',
              t('plan.host.mapSuccess.title'),
              t('plan.host.mapSuccess.detail', { path, added: result.added, target: targetSpecTasks }),
            )
          }}
          onMapPlanToSpecAndRun={(path, steps, targetSpecPath) => {
            const targetSpecTasks = targetSpecPath || findLatestSpecTasksPath(files)
            if (!targetSpecTasks) {
              notify('error', t('plan.host.mapFailed.title'), t('plan.host.mapFailed.detail'))
              return
            }
            const result = appendPlanStepsToSpecTasks(files, targetSpecTasks, steps.map((s) => s.text))
            if (result.added === 0) {
              notify('info', t('plan.host.mapNothing.title'), t('plan.host.mapNothing.detail'))
              return
            }
            const linkInput = result.addedSteps.map((taskText) => {
              const source = steps.find((step) => step.text.trim().toLowerCase() === taskText.trim().toLowerCase())
              return {
                planPath: path,
                planStepText: source?.text ?? taskText,
                planStepLine: source?.line,
                specTasksPath: targetSpecTasks,
                specTaskText: taskText,
              }
            })
            const nextFiles = upsertPlanSpecLinksFile(result.files, linkInput)
            setFiles(nextFiles)
            const acceptancePath = targetSpecTasks.replace(/[\\/]tasks\.md$/i, '/acceptance.md')
            const executionQueue = result.addedSteps.map((taskText) => ({
              prompt: `请执行这个规格任务，并说明改动文件与验证步骤：\n\n[${targetSpecTasks}] ${taskText}`,
              backfill: {
                taskPath: targetSpecTasks,
                taskText,
                specAcceptancePath: acceptancePath,
              },
            }))
            const [first, ...rest] = executionQueue
            if (first) {
              const existing = new Set(
                queuedSpecExecutions.map((item) => `${item.backfill.taskPath}::${item.backfill.taskText.trim().toLowerCase()}`),
              )
              const dedupedRest = rest.filter((item) => {
                const key = `${item.backfill.taskPath}::${item.backfill.taskText.trim().toLowerCase()}`
                if (existing.has(key)) return false
                existing.add(key)
                return true
              })
              setQueuedChatPrompt(first.prompt)
              setQueuedSpecBackfill(first.backfill)
              setQueuedSpecExecutions([...queuedSpecExecutions, ...dedupedRest])
              closeSettingsPanel()
              openChatPanel()
            }
            notify(
              'success',
              t('plan.host.mapRunSuccess.title'),
              t('plan.host.mapRunSuccess.detail', { path, added: result.added, target: targetSpecTasks }),
            )
          }}
          onDeletePlan={(path) => {
            void (async () => {
              const ok = await requestConfirm({
                title: t('plan.host.deleteConfirm.title'),
                message: t('plan.host.deleteConfirm.message', { path }),
                confirmText: t('plan.host.deleteConfirm.confirm'),
                tone: 'danger',
              })
              if (!ok) return
              setFiles((prev) => prev.filter((f) => f.name !== path))
              notify('success', t('plan.host.deleted.title'), t('plan.host.deleted.detail', { path }))
            })()
          }}
          onOpenLatestReport={() => {
            const path = findLatestReportPath(files.map((f) => ({ name: f.name, content: f.content })))
            if (!path) {
              notify('info', t('report.host.noReports.title'), t('report.host.noReports.detail'))
              return
            }
            const targetIndex = files.findIndex((file) => file.name === path)
            if (targetIndex < 0) {
              notify('error', t('report.host.openFailed.title'), t('report.host.openFailed.detail', { path }))
              return
            }
            setActiveFile(targetIndex)
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          reportItems={reportItems}
          onOpenReport={(path) => {
            const targetIndex = files.findIndex((file) => file.name === path)
            if (targetIndex < 0) return
            setActiveFile(targetIndex)
            setEditorTarget({ line: 1, column: 1, nonce: Date.now() })
            closeSettingsPanel()
          }}
          onDeleteReport={(path) => {
            void (async () => {
              const ok = await requestConfirm({
                title: t('report.host.deleteConfirm.title'),
                message: t('report.host.deleteConfirm.message', { path }),
                confirmText: t('report.host.deleteConfirm.confirm'),
                tone: 'danger',
              })
              if (!ok) return
              setFiles((prev) => prev.filter((f) => f.name !== path))
              notify('success', t('report.host.deleted.title'), t('report.host.deleted.detail', { path }))
            })()
          }}
          onDeleteReports={(paths) => {
            if (paths.length === 0) return
            void (async () => {
              const preview = paths.slice(0, 6).join('\n')
              const ok = await requestConfirm({
                title: t('report.host.bulkDeleteConfirm.title'),
                message: t('report.host.bulkDeleteConfirm.message', {
                  count: paths.length,
                  preview,
                  more: paths.length > 6 ? t('report.host.previewMore') : '',
                }),
                confirmText: t('report.host.deleteConfirm.confirm'),
                tone: 'danger',
              })
              if (!ok) return
              setFiles((prev) => removeReportsFromFiles(prev, paths))
              notify(
                'success',
                t('report.host.bulkDeleted.title'),
                t('report.host.bulkDeleted.detail', { count: paths.length }),
              )
            })()
          }}
          onPruneReports={(keepRecent) => {
            const toDelete = pickReportPathsToPrune(reportItems, keepRecent)
            if (toDelete.length === 0) {
              notify('info', t('report.host.pruneNothing.title'), t('report.host.pruneNothing.detail', { keepRecent }))
              return
            }
            void (async () => {
              const preview = toDelete.slice(0, 6).join('\n')
              const ok = await requestConfirm({
                title: t('report.host.pruneConfirm.title'),
                message: t('report.host.pruneConfirm.message', {
                  keepRecent,
                  count: toDelete.length,
                  preview,
                  more: toDelete.length > 6 ? t('report.host.previewMore') : '',
                }),
                confirmText: t('report.host.pruneConfirm.confirm'),
                tone: 'danger',
              })
              if (!ok) return
              setFiles((prev) => removeReportsFromFiles(prev, toDelete))
              notify(
                'success',
                t('report.host.pruneDone.title'),
                t('report.host.pruneDone.detail', { deleted: toDelete.length, keepRecent }),
              )
            })()
          }}
          onExportReportsZip={(paths) => {
            if (paths.length === 0) return
            void (async () => {
              try {
                const blob = await buildReportsZipBlob(files, paths)
                downloadBlob(blob, `aide-reports-${Date.now()}.zip`)
                notify('success', t('report.host.zipExported.title'), t('report.host.zipExported.detail', { count: paths.length }))
              } catch (error) {
                notify(
                  'error',
                  t('report.host.zipFailed.title'),
                  error instanceof Error ? error.message : t('report.host.zipFailed.detail'),
                )
              }
            })()
          }}
          getRestorePreview={(path) => {
            const file = files.find((f) => f.name === path)
            if (!file) return null
            return buildQueueRestorePreview(
              file.content,
              files.map((f) => ({ name: f.name, content: f.content })),
            )
          }}
          onRestoreReport={(path) => {
            const file = files.find((f) => f.name === path)
            if (!file) return
            const fileLikes = files.map((f) => ({ name: f.name, content: f.content }))
            const preview = buildQueueRestorePreview(file.content, fileLikes)
            void (async () => {
              if (!hasQueueRestoreItems(preview)) {
                notify(
                  'info',
                  t('report.host.restoreNothing.title'),
                  preview.unresolved.length
                    ? preview.unresolved.join('；')
                    : t('report.host.restoreNothing.detail'),
                )
                return
              }
              const ok = await requestConfirm({
                title: t('report.host.restoreConfirm.title'),
                message: formatQueueRestorePreview(preview),
                confirmText: t('report.host.restoreConfirm.confirm'),
              })
              if (!ok) return
              const result = buildQueueRestoreFromReport(file.content, fileLikes)
              const mergedPlan = mergePlanRestoreItems(queuedPlanExecutions, result.planItems, queuedPlanBackfill)
              const mergedSpec = mergeSpecRestoreItems(queuedSpecExecutions, result.specItems, queuedSpecBackfill)
              if (mergedSpec.length > 0) {
                const [first, ...rest] = mergedSpec
                setQueuedSpecExecutions(rest)
                setQueuedPlanExecutions(mergedPlan)
                setQueuedSpecBackfill(first.backfill)
                setQueuedChatPrompt(first.prompt)
              } else if (mergedPlan.length > 0) {
                const [first, ...rest] = mergedPlan
                setQueuedPlanExecutions(rest)
                setQueuedSpecExecutions([])
                setQueuedPlanBackfill(first.backfill)
                setQueuedChatPrompt(first.prompt)
              }
              closeSettingsPanel()
              openChatPanel()
              notify(
                'success',
                t('report.host.restoreDone.title'),
                t('report.host.restoreDone.detail', {
                  plan: result.planItems.length,
                  spec: result.specItems.length,
                  unresolved: result.unresolved.length,
                  unresolvedSuffix:
                    result.unresolved.length > 0
                      ? t('report.host.restoreDone.unresolvedSuffix', { count: result.unresolved.length })
                      : '',
                }),
              )
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
        currentFileName={activeTabMeta?.name || 'Untitled'}
        currentFileLanguage={activeTabMeta?.language || 'plaintext'}
        lineCount={activeFileTab?.content.split('\n').length || 0}
        charCount={activeFileTab?.content.length || 0}
        diagnosticCount={diagnosticCount}
        diagnosticErrors={diagnosticErrors}
        diagnosticWarnings={diagnosticWarnings}
        isWebContainerReady={isWebContainerReady}
        aiProvider={aiConfig.provider}
        isAIConnected={!!aiConfig.apiKey}
        autoSaveEnabled={autoSaveEnabled}
        language={language}
        workspaceFileCount={files.length}
        onOpenSettings={openSettingsPanel}
        onOpenAISettings={() => setShowAISettings(true)}
        onToggleAutoSave={() => {
          const nextValue = !autoSaveEnabled
          setAutoSaveEnabled(nextValue)
          notify('success', nextValue ? t('notify.autosaveOn') : t('notify.autosaveOff'))
        }}
        gitBranch={gitBranch}
        gitModified={gitModified}
        gitUnstaged={gitUnstaged}
        gitStageAllDisabled={gitStageAllDisabled}
        onOpenGitPanel={openGitPanel}
        onStageAll={onStageAll ? () => void onStageAll() : undefined}
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
          onRegister={() => closeWelcomeAnd(openRegisterDialog)}
        />
      )}
    </>
  )
}
