import { create } from 'zustand'
import { createTranslator } from '../i18n'
import { readStoredApiLanguage } from '../lib/apiLanguage'
import { modelOptions, type AIModel } from '../services/aiService'
import type { User as AuthUser } from '../services/authService'
import type { RecentProject } from '../services/recentFilesService'
import type { FileItem } from '../types/file'

export type EditorTheme = 'vs-dark' | 'light'

export interface AIConfigState {
  provider: AIModel
  apiKey: string
  model: string
  endpoint: string
}

export interface EditorTarget {
  line: number
  column?: number
  nonce: number
}

export interface DiffContent {
  old: string
  new: string
}

export interface AgentApplyItem {
  path: string
  oldContent: string
  newContent: string
  language: string
}

export interface PluginToolbarButton {
  id: string
  pluginId: string
  icon: string
  label: string
  onClick: () => void
}

export interface PluginModalState {
  title: string
  body: string
}

export type RightPanelView = 'chat' | 'backgroundJobs'

function buildDefaultFiles(): FileItem[] {
  const t = createTranslator(readStoredApiLanguage())
  return [
    {
      name: 'index.js',
      content: `${t('editor.defaultFileComment')}\nconsole.log("Hello World!");`,
      language: 'javascript',
    },
  ]
}

const defaultFiles: FileItem[] = buildDefaultFiles()

const defaultAiConfig: AIConfigState = {
  provider: 'openai',
  apiKey: '',
  model: modelOptions.openai.models[0],
  endpoint: '',
}

type BooleanUpdater = boolean | ((prev: boolean) => boolean)

function resolveBoolean(value: BooleanUpdater, prev: boolean): boolean {
  return typeof value === 'function' ? value(prev) : value
}

type FilesUpdater = FileItem[] | ((prev: FileItem[]) => FileItem[])

function resolveFiles(value: FilesUpdater, prev: FileItem[]): FileItem[] {
  return typeof value === 'function' ? value(prev) : value
}

export interface IDEState {
  files: FileItem[]
  activeFile: number
  newFileName: string
  theme: EditorTheme
  autoSaveEnabled: boolean
  aiConfig: AIConfigState
  diffContent: DiffContent | null
  editorTarget: EditorTarget | null
  diagnosticCount: number
  recentProjects: RecentProject[]
  currentUser: AuthUser | null
  authChecked: boolean
  currentPlan: string
  collaborationRoomId: string | null
  queuedChatPrompt: string | null
  queuedSpecBackfill: QueuedSpecBackfill | null
  queuedSpecExecutions: QueuedSpecExecution[]
  queuedPlanBackfill: QueuedPlanBackfill | null
  queuedPlanExecutions: QueuedPlanExecution[]

  showNewFileInput: boolean
  showTerminal: boolean
  showTemplateModal: boolean
  showShareModal: boolean
  showGitPanel: boolean
  showAISettings: boolean
  showImportModal: boolean
  showSearchPanel: boolean
  showPreview: boolean
  showCollaboration: boolean
  showPluginManager: boolean
  showDropZone: boolean
  showDiff: boolean
  showCodeReview: boolean
  showSnippetLibrary: boolean
  showPerformance: boolean
  showSettingsCenter: boolean
  showCommandPalette: boolean
  showChatPanel: boolean
  rightPanelView: RightPanelView
  showWorkspaceManager: boolean
  showWorkspacePanel: boolean
  showThemeSelector: boolean
  showWelcome: boolean
  showAuthModal: boolean
  showSubscriptionModal: boolean
  showAgentApplyModal: boolean
  agentApplyQueue: AgentApplyItem[] | null
  agentApplyIndex: number
  pluginToolbarButtons: PluginToolbarButton[]
  pluginModal: PluginModalState | null

  setFiles: (files: FilesUpdater) => void
  setActiveFile: (index: number) => void
  setNewFileName: (name: string) => void
  setTheme: (theme: EditorTheme) => void
  setAutoSaveEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void
  setAiConfig: (config: AIConfigState | ((prev: AIConfigState) => AIConfigState)) => void
  setDiffContent: (content: DiffContent | null) => void
  setEditorTarget: (target: EditorTarget | null) => void
  setDiagnosticCount: (count: number) => void
  setRecentProjects: (projects: RecentProject[]) => void
  setCurrentUser: (user: AuthUser | null) => void
  setAuthChecked: (checked: boolean) => void
  setCurrentPlan: (plan: string) => void
  setCollaborationRoomId: (roomId: string | null) => void
  setQueuedChatPrompt: (prompt: string | null) => void
  setQueuedSpecBackfill: (backfill: QueuedSpecBackfill | null) => void
  setQueuedSpecExecutions: (items: QueuedSpecExecution[]) => void
  shiftQueuedSpecExecution: () => QueuedSpecExecution | null
  setQueuedPlanBackfill: (backfill: QueuedPlanBackfill | null) => void
  setQueuedPlanExecutions: (items: QueuedPlanExecution[]) => void
  shiftQueuedPlanExecution: () => QueuedPlanExecution | null

  setShowNewFileInput: (show: BooleanUpdater) => void
  setShowTerminal: (show: BooleanUpdater) => void
  setShowTemplateModal: (show: boolean) => void
  setShowShareModal: (show: boolean) => void
  setShowGitPanel: (show: BooleanUpdater) => void
  setShowAISettings: (show: boolean) => void
  setShowImportModal: (show: boolean) => void
  setShowSearchPanel: (show: boolean) => void
  setShowPreview: (show: boolean) => void
  setShowCollaboration: (show: boolean) => void
  setShowPluginManager: (show: boolean) => void
  setShowDropZone: (show: boolean) => void
  setShowDiff: (show: boolean) => void
  setShowCodeReview: (show: boolean) => void
  setShowSnippetLibrary: (show: boolean) => void
  setShowPerformance: (show: boolean) => void
  setShowSettingsCenter: (show: boolean) => void
  setShowCommandPalette: (show: boolean) => void
  setShowChatPanel: (show: boolean) => void
  setRightPanelView: (view: RightPanelView) => void
  setShowWorkspaceManager: (show: boolean) => void
  setShowWorkspacePanel: (show: boolean) => void
  setShowThemeSelector: (show: boolean) => void
  setShowWelcome: (show: boolean) => void
  setShowAuthModal: (show: boolean) => void
  setShowSubscriptionModal: (show: boolean) => void
  setShowAgentApplyModal: (show: boolean) => void
  setAgentApplyQueue: (queue: AgentApplyItem[] | null) => void
  setAgentApplyIndex: (index: number) => void
  addPluginToolbarButton: (button: PluginToolbarButton) => void
  clearPluginToolbarButtons: (pluginId: string) => void
  setPluginModal: (modal: PluginModalState | null) => void
}

export interface QueuedSpecBackfill {
  taskPath: string
  taskText: string
  specAcceptancePath: string
}

export interface QueuedSpecExecution {
  prompt: string
  backfill: QueuedSpecBackfill
}

export interface QueuedPlanBackfill {
  planPath: string
  stepText: string
  stepLine?: number
}

export interface QueuedPlanExecution {
  prompt: string
  backfill: QueuedPlanBackfill
}

export const useIDEStore = create<IDEState>()((set) => ({
  files: defaultFiles,
  activeFile: 0,
  newFileName: '',
  theme: 'vs-dark',
  autoSaveEnabled: true,
  aiConfig: defaultAiConfig,
  diffContent: null,
  editorTarget: null,
  diagnosticCount: 0,
  recentProjects: [],
  currentUser: null,
  authChecked: false,
  currentPlan: 'free',
  collaborationRoomId: null,
  queuedChatPrompt: null,
  queuedSpecBackfill: null,
  queuedSpecExecutions: [],
  queuedPlanBackfill: null,
  queuedPlanExecutions: [],

  showNewFileInput: false,
  showTerminal: false,
  showTemplateModal: false,
  showShareModal: false,
  showGitPanel: false,
  showAISettings: false,
  showImportModal: false,
  showSearchPanel: false,
  showPreview: false,
  showCollaboration: false,
  showPluginManager: false,
  showDropZone: false,
  showDiff: false,
  showCodeReview: false,
  showSnippetLibrary: false,
  showPerformance: false,
  showSettingsCenter: false,
  showCommandPalette: false,
  showChatPanel: false,
  rightPanelView: 'chat',
  showWorkspaceManager: false,
  showWorkspacePanel: false,
  showThemeSelector: false,
  showWelcome: false,
  showAuthModal: false,
  showSubscriptionModal: false,
  showAgentApplyModal: false,
  agentApplyQueue: null,
  agentApplyIndex: 0,
  pluginToolbarButtons: [],
  pluginModal: null,

  setFiles: (files) => set((state) => ({ files: resolveFiles(files, state.files) })),
  setActiveFile: (activeFile) => set({ activeFile }),
  setNewFileName: (newFileName) => set({ newFileName }),
  setTheme: (theme) => set({ theme }),
  setAutoSaveEnabled: (enabled) =>
    set((state) => ({ autoSaveEnabled: resolveBoolean(enabled, state.autoSaveEnabled) })),
  setAiConfig: (config) =>
    set((state) => ({
      aiConfig: typeof config === 'function' ? config(state.aiConfig) : config,
    })),
  setDiffContent: (diffContent) => set({ diffContent }),
  setEditorTarget: (editorTarget) => set({ editorTarget }),
  setDiagnosticCount: (diagnosticCount) => set({ diagnosticCount }),
  setRecentProjects: (recentProjects) => set({ recentProjects }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setAuthChecked: (authChecked) => set({ authChecked }),
  setCurrentPlan: (currentPlan) => set({ currentPlan }),
  setCollaborationRoomId: (collaborationRoomId) => set({ collaborationRoomId }),
  setQueuedChatPrompt: (queuedChatPrompt) => set({ queuedChatPrompt }),
  setQueuedSpecBackfill: (queuedSpecBackfill) => set({ queuedSpecBackfill }),
  setQueuedSpecExecutions: (queuedSpecExecutions) => set({ queuedSpecExecutions }),
  shiftQueuedSpecExecution: () => {
    let shifted: QueuedSpecExecution | null = null
    set((state) => {
      if (state.queuedSpecExecutions.length === 0) return state
      const [first, ...rest] = state.queuedSpecExecutions
      shifted = first
      return { queuedSpecExecutions: rest }
    })
    return shifted
  },
  setQueuedPlanBackfill: (queuedPlanBackfill) => set({ queuedPlanBackfill }),
  setQueuedPlanExecutions: (queuedPlanExecutions) => set({ queuedPlanExecutions }),
  shiftQueuedPlanExecution: () => {
    let shifted: QueuedPlanExecution | null = null
    set((state) => {
      if (state.queuedPlanExecutions.length === 0) return state
      const [first, ...rest] = state.queuedPlanExecutions
      shifted = first
      return { queuedPlanExecutions: rest }
    })
    return shifted
  },

  setShowNewFileInput: (value) =>
    set((state) => ({ showNewFileInput: resolveBoolean(value, state.showNewFileInput) })),
  setShowTerminal: (value) =>
    set((state) => ({ showTerminal: resolveBoolean(value, state.showTerminal) })),
  setShowTemplateModal: (showTemplateModal) => set({ showTemplateModal }),
  setShowShareModal: (showShareModal) => set({ showShareModal }),
  setShowGitPanel: (value) =>
    set((state) => ({ showGitPanel: resolveBoolean(value, state.showGitPanel) })),
  setShowAISettings: (showAISettings) => set({ showAISettings }),
  setShowImportModal: (showImportModal) => set({ showImportModal }),
  setShowSearchPanel: (showSearchPanel) => set({ showSearchPanel }),
  setShowPreview: (showPreview) => set({ showPreview }),
  setShowCollaboration: (showCollaboration) => set({ showCollaboration }),
  setShowPluginManager: (showPluginManager) => set({ showPluginManager }),
  setShowDropZone: (showDropZone) => set({ showDropZone }),
  setShowDiff: (showDiff) => set({ showDiff }),
  setShowCodeReview: (showCodeReview) => set({ showCodeReview }),
  setShowSnippetLibrary: (showSnippetLibrary) => set({ showSnippetLibrary }),
  setShowPerformance: (showPerformance) => set({ showPerformance }),
  setShowSettingsCenter: (showSettingsCenter) => set({ showSettingsCenter }),
  setShowCommandPalette: (showCommandPalette) => set({ showCommandPalette }),
  setShowChatPanel: (showChatPanel) => set({ showChatPanel }),
  setRightPanelView: (rightPanelView) => set({ rightPanelView }),
  setShowWorkspaceManager: (showWorkspaceManager) => set({ showWorkspaceManager }),
  setShowWorkspacePanel: (showWorkspacePanel) => set({ showWorkspacePanel }),
  setShowThemeSelector: (showThemeSelector) => set({ showThemeSelector }),
  setShowWelcome: (showWelcome) => set({ showWelcome }),
  setShowAuthModal: (showAuthModal) => set({ showAuthModal }),
  setShowSubscriptionModal: (showSubscriptionModal) => set({ showSubscriptionModal }),
  setShowAgentApplyModal: (showAgentApplyModal) => set({ showAgentApplyModal }),
  setAgentApplyQueue: (agentApplyQueue) => set({ agentApplyQueue, agentApplyIndex: 0 }),
  setAgentApplyIndex: (agentApplyIndex) => set({ agentApplyIndex }),
  addPluginToolbarButton: (button) =>
    set((state) => ({
      pluginToolbarButtons: [...state.pluginToolbarButtons.filter((item) => item.id !== button.id), button],
    })),
  clearPluginToolbarButtons: (pluginId) =>
    set((state) => ({
      pluginToolbarButtons: state.pluginToolbarButtons.filter((button) => button.pluginId !== pluginId),
    })),
  setPluginModal: (pluginModal) => set({ pluginModal }),
}))
