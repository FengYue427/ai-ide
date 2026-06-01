import { create } from 'zustand'
import { createTranslator } from '../i18n'
import { readStoredApiLanguage } from '../lib/apiLanguage'
import { BOTTOM_PANEL_DEFAULT_HEIGHT } from '../lib/bottomPanelPrefs'
import { modelOptions, type AIModel } from '../services/aiService'
import type { User as AuthUser } from '../services/authService'
import type { RecentProject } from '../services/recentFilesService'
import { openGitDiffTabState, type OpenGitDiffTabInput } from '../lib/openGitDiffTab'
import type { GitDiffTab } from '../types/editorTab'
import type { FileItem } from '../types/file'
import {
  loadDebugBreakpoints,
  saveDebugBreakpoints,
  setBreakpointEnabledInList,
  toggleBreakpointInList,
  type DebugBreakpoint,
} from '../lib/debugBreakpoints'
import type { DebugAttachPhase, DebugRuntimeKind, DebugSyncMode } from '../services/debugAlphaService'
import type { DebugLocalVariable, DebugStackFrame } from '../types/debugInspect'
import {
  loadGitStatusRefreshPrefs,
  saveGitStatusRefreshPrefs,
} from '../lib/gitStatusRefreshPrefs'

export type ActiveEditorSurface = 'file' | 'git-diff'

export interface DebugSessionState {
  phase: DebugAttachPhase
  runtimeKind: DebugRuntimeKind | null
  entryFile: string | null
  inspectUrl: string | null
  error: string | null
  syncMode: DebugSyncMode | null
  registeredBreakpointCount: number
  pausedAt: { path: string; line: number } | null
  callStack: DebugStackFrame[]
  locals: DebugLocalVariable[]
  activeStackFrameIndex: number
}

const defaultDebugSession: DebugSessionState = {
  phase: 'idle',
  runtimeKind: null,
  entryFile: null,
  inspectUrl: null,
  error: null,
  syncMode: null,
  registeredBreakpointCount: 0,
  pausedAt: null,
  callStack: [],
  locals: [],
  activeStackFrameIndex: 0,
}

export type EditorTheme = 'vs-dark' | 'light'

export type AiKeyMode = 'byok' | 'platform'

export interface AIConfigState {
  provider: AIModel
  apiKey: string
  model: string
  endpoint: string
  keyMode: AiKeyMode
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

export type BottomPanelTab = 'terminal' | 'scripts' | 'tasks' | 'debug'

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
  provider: 'deepseek',
  apiKey: '',
  model: modelOptions.deepseek.models[0],
  endpoint: '',
  keyMode: 'platform',
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
  gitDiffTabs: GitDiffTab[]
  activeEditorSurface: ActiveEditorSurface
  activeGitDiffTab: number
  activeFile: number
  newFileName: string
  theme: EditorTheme
  autoSaveEnabled: boolean
  formatOnSaveEnabled: boolean
  formatDocumentNonce: number
  aiConfig: AIConfigState
  diffContent: DiffContent | null
  editorTarget: EditorTarget | null
  diagnosticCount: number
  diagnosticErrors: number
  diagnosticWarnings: number
  recentProjects: RecentProject[]
  currentUser: AuthUser | null
  authChecked: boolean
  currentPlan: string
  collaborationRoomId: string | null
  collaborationMemberRole: 'host' | 'editor' | 'viewer' | null
  collaborationSignalingMode: 'livekit' | 'yjs-webrtc' | null
  collaborationRoomMembers: Array<{
    id: string
    userId: string
    role: string
    joinedAt: string
    leftAt: string | null
  }> | null
  queuedChatPrompt: string | null
  queuedSpecBackfill: QueuedSpecBackfill | null
  queuedSpecExecutions: QueuedSpecExecution[]
  queuedPlanBackfill: QueuedPlanBackfill | null
  queuedPlanExecutions: QueuedPlanExecution[]

  showNewFileInput: boolean
  showTerminal: boolean
  bottomPanelTab: BottomPanelTab
  bottomPanelHeight: number
  debugBreakpoints: DebugBreakpoint[]
  debugSession: DebugSessionState
  gitManualRefreshOnly: boolean
  gitStatusRefreshNonce: number
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
  backgroundJobsActiveCount: number
  showWorkspaceManager: boolean
  showWorkspacePanel: boolean
  showThemeSelector: boolean
  showWelcome: boolean
  showAuthModal: boolean
  authModalTab: 'login' | 'register' | 'forgot'
  showSubscriptionModal: boolean
  showAgentApplyModal: boolean
  agentApplyQueue: AgentApplyItem[] | null
  agentApplyIndex: number
  pluginToolbarButtons: PluginToolbarButton[]
  pluginModal: PluginModalState | null

  setFiles: (files: FilesUpdater) => void
  openGitDiffTab: (input: OpenGitDiffTabInput) => void
  closeGitDiffTab: (index: number) => void
  setActiveFile: (index: number) => void
  setActiveGitDiffTab: (index: number) => void
  setNewFileName: (name: string) => void
  setTheme: (theme: EditorTheme) => void
  setAutoSaveEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void
  setFormatOnSaveEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void
  requestFormatDocument: () => void
  setAiConfig: (config: AIConfigState | ((prev: AIConfigState) => AIConfigState)) => void
  setDiffContent: (content: DiffContent | null) => void
  setEditorTarget: (target: EditorTarget | null) => void
  setDiagnosticCount: (count: number) => void
  setDiagnosticSummary: (summary: { errors: number; warnings: number }) => void
  setRecentProjects: (projects: RecentProject[]) => void
  setCurrentUser: (user: AuthUser | null) => void
  setAuthChecked: (checked: boolean) => void
  setCurrentPlan: (plan: string) => void
  setCollaborationRoomId: (roomId: string | null) => void
  setCollaborationMemberRole: (role: 'host' | 'editor' | 'viewer' | null) => void
  setCollaborationSignalingMode: (mode: 'livekit' | 'yjs-webrtc' | null) => void
  setCollaborationRoomMembers: (
    members: Array<{
      id: string
      userId: string
      role: string
      joinedAt: string
      leftAt: string | null
    }> | null,
  ) => void
  setQueuedChatPrompt: (prompt: string | null) => void
  setQueuedSpecBackfill: (backfill: QueuedSpecBackfill | null) => void
  setQueuedSpecExecutions: (items: QueuedSpecExecution[]) => void
  shiftQueuedSpecExecution: () => QueuedSpecExecution | null
  setQueuedPlanBackfill: (backfill: QueuedPlanBackfill | null) => void
  setQueuedPlanExecutions: (items: QueuedPlanExecution[]) => void
  shiftQueuedPlanExecution: () => QueuedPlanExecution | null

  setShowNewFileInput: (show: BooleanUpdater) => void
  setShowTerminal: (show: BooleanUpdater) => void
  setBottomPanelTab: (tab: BottomPanelTab) => void
  setBottomPanelHeight: (height: number) => void
  toggleDebugBreakpoint: (path: string, line: number) => void
  setDebugBreakpointEnabled: (path: string, line: number, enabled: boolean) => void
  setDebugSession: (patch: Partial<DebugSessionState>) => void
  resetDebugSession: () => void
  setGitManualRefreshOnly: (enabled: boolean) => void
  bumpGitStatusRefresh: () => void
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
  setBackgroundJobsActiveCount: (count: number) => void
  setShowWorkspaceManager: (show: boolean) => void
  setShowWorkspacePanel: (show: boolean) => void
  setShowThemeSelector: (show: boolean) => void
  setShowWelcome: (show: boolean) => void
  setShowAuthModal: (show: boolean) => void
  setAuthModalTab: (tab: 'login' | 'register' | 'forgot') => void
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
  gitDiffTabs: [],
  activeEditorSurface: 'file',
  activeGitDiffTab: 0,
  activeFile: 0,
  newFileName: '',
  theme: 'vs-dark',
  autoSaveEnabled: true,
  formatOnSaveEnabled: false,
  formatDocumentNonce: 0,
  aiConfig: defaultAiConfig,
  diffContent: null,
  editorTarget: null,
  diagnosticCount: 0,
  diagnosticErrors: 0,
  diagnosticWarnings: 0,
  recentProjects: [],
  currentUser: null,
  authChecked: false,
  currentPlan: 'free',
  collaborationRoomId: null,
  collaborationMemberRole: null,
  collaborationSignalingMode: null,
  collaborationRoomMembers: null,
  queuedChatPrompt: null,
  queuedSpecBackfill: null,
  queuedSpecExecutions: [],
  queuedPlanBackfill: null,
  queuedPlanExecutions: [],

  showNewFileInput: false,
  showTerminal: false,
  bottomPanelTab: 'terminal',
  bottomPanelHeight: BOTTOM_PANEL_DEFAULT_HEIGHT,
  debugBreakpoints: loadDebugBreakpoints(),
  debugSession: { ...defaultDebugSession },
  gitManualRefreshOnly: loadGitStatusRefreshPrefs().manualRefreshOnly,
  gitStatusRefreshNonce: 0,
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
  backgroundJobsActiveCount: 0,
  showWorkspaceManager: false,
  showWorkspacePanel: false,
  showThemeSelector: false,
  showWelcome: false,
  showAuthModal: false,
  authModalTab: 'login',
  showSubscriptionModal: false,
  showAgentApplyModal: false,
  agentApplyQueue: null,
  agentApplyIndex: 0,
  pluginToolbarButtons: [],
  pluginModal: null,

  setFiles: (files) => set((state) => ({ files: resolveFiles(files, state.files) })),
  openGitDiffTab: (input) =>
    set((state) => {
      const result = openGitDiffTabState(state.gitDiffTabs, input)
      return {
        gitDiffTabs: result.tabs,
        activeGitDiffTab: result.activeIndex,
        activeEditorSurface: 'git-diff',
      }
    }),
  closeGitDiffTab: (index) =>
    set((state) => {
      const nextTabs = state.gitDiffTabs.filter((_, tabIndex) => tabIndex !== index)
      let nextActive = state.activeGitDiffTab
      let nextSurface = state.activeEditorSurface

      if (state.activeEditorSurface === 'git-diff') {
        if (index === state.activeGitDiffTab) {
          if (nextTabs.length === 0) {
            nextSurface = 'file'
            nextActive = 0
          } else {
            nextActive = Math.min(state.activeGitDiffTab, nextTabs.length - 1)
          }
        } else if (index < state.activeGitDiffTab) {
          nextActive = state.activeGitDiffTab - 1
        }
      }

      return {
        gitDiffTabs: nextTabs,
        activeGitDiffTab: nextActive,
        activeEditorSurface: nextSurface,
      }
    }),
  setActiveFile: (activeFile) => set({ activeFile, activeEditorSurface: 'file' }),
  setActiveGitDiffTab: (activeGitDiffTab) => set({ activeGitDiffTab, activeEditorSurface: 'git-diff' }),
  setNewFileName: (newFileName) => set({ newFileName }),
  setTheme: (theme) => set({ theme }),
  setAutoSaveEnabled: (enabled) =>
    set((state) => ({ autoSaveEnabled: resolveBoolean(enabled, state.autoSaveEnabled) })),
  setFormatOnSaveEnabled: (enabled) =>
    set((state) => ({ formatOnSaveEnabled: resolveBoolean(enabled, state.formatOnSaveEnabled) })),
  requestFormatDocument: () =>
    set((state) => ({ formatDocumentNonce: state.formatDocumentNonce + 1 })),
  setAiConfig: (config) =>
    set((state) => ({
      aiConfig: typeof config === 'function' ? config(state.aiConfig) : config,
    })),
  setDiffContent: (diffContent) => set({ diffContent }),
  setEditorTarget: (editorTarget) => set({ editorTarget }),
  setDiagnosticCount: (diagnosticCount) => set({ diagnosticCount }),
  setDiagnosticSummary: ({ errors, warnings }) =>
    set({
      diagnosticErrors: errors,
      diagnosticWarnings: warnings,
      diagnosticCount: errors + warnings,
    }),
  setRecentProjects: (recentProjects) => set({ recentProjects }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setAuthChecked: (authChecked) => set({ authChecked }),
  setCurrentPlan: (currentPlan) => set({ currentPlan }),
  setCollaborationRoomId: (collaborationRoomId) =>
    set({
      collaborationRoomId,
      ...(collaborationRoomId
        ? {}
        : {
            collaborationMemberRole: null,
            collaborationSignalingMode: null,
            collaborationRoomMembers: null,
          }),
    }),
  setCollaborationMemberRole: (collaborationMemberRole) => set({ collaborationMemberRole }),
  setCollaborationSignalingMode: (collaborationSignalingMode) => set({ collaborationSignalingMode }),
  setCollaborationRoomMembers: (collaborationRoomMembers) => set({ collaborationRoomMembers }),
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
  setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),
  setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
  toggleDebugBreakpoint: (path, line) =>
    set((state) => {
      const debugBreakpoints = toggleBreakpointInList(state.debugBreakpoints, path, line)
      saveDebugBreakpoints(debugBreakpoints)
      return { debugBreakpoints }
    }),
  setDebugBreakpointEnabled: (path, line, enabled) =>
    set((state) => {
      const debugBreakpoints = setBreakpointEnabledInList(state.debugBreakpoints, path, line, enabled)
      saveDebugBreakpoints(debugBreakpoints)
      return { debugBreakpoints }
    }),
  setDebugSession: (patch) =>
    set((state) => ({
      debugSession: { ...state.debugSession, ...patch },
    })),
  resetDebugSession: () => set({ debugSession: { ...defaultDebugSession } }),
  setGitManualRefreshOnly: (enabled) => {
    saveGitStatusRefreshPrefs({ manualRefreshOnly: enabled })
    set({ gitManualRefreshOnly: enabled })
  },
  bumpGitStatusRefresh: () =>
    set((state) => ({ gitStatusRefreshNonce: state.gitStatusRefreshNonce + 1 })),
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
  setBackgroundJobsActiveCount: (backgroundJobsActiveCount) => set({ backgroundJobsActiveCount }),
  setShowWorkspaceManager: (showWorkspaceManager) => set({ showWorkspaceManager }),
  setShowWorkspacePanel: (showWorkspacePanel) => set({ showWorkspacePanel }),
  setShowThemeSelector: (showThemeSelector) => set({ showThemeSelector }),
  setShowWelcome: (showWelcome) => set({ showWelcome }),
  setShowAuthModal: (showAuthModal) => set({ showAuthModal }),
  setAuthModalTab: (authModalTab) => set({ authModalTab }),
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
