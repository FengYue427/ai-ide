import type { Language, TranslateFn } from '../i18n'
import type { FileItem } from '../types/file'
import type { WorkspaceMode } from './workspaceMode'
import { recordCapstoneFunnelMetric } from './capstoneFunnelMetrics'
import { trackCapstoneFunnelStep } from './conversionTracking'
import {
  enqueueFirstOpenSpecTaskViaRuntime,
  type FirstOpenSpecTaskResult,
} from '../services/specTaskExecutionService'
import type { SpecQueueCoordinatorDeps } from '../services/runtime/runtimeQueueCoordinator'
import { patchOpenChatPanel } from './workbenchLayout'
import type { ToastKind } from '../components/FeedbackCenter'
import { useIDEStore } from '../store/ideStore'

export interface CapstoneAutoLaunchInput {
  tasksPath: string
  specSlug: string
  filesSnapshot: FileItem[]
  language: Language
  deps: SpecQueueCoordinatorDeps
  applyWorkspaceMode: (mode: WorkspaceMode) => void
  setFocusTasksPath: (path: string) => void
  onBeforeOpenChat: () => void
  openChatPanel: () => void
  notify: (kind: ToastKind, title: string, detail?: string) => void
  t: TranslateFn
}

export type { FirstOpenSpecTaskResult }

export async function launchCapstoneAfterCreate(input: CapstoneAutoLaunchInput): Promise<void> {
  const {
    tasksPath,
    specSlug,
    filesSnapshot,
    language,
    deps,
    applyWorkspaceMode,
    setFocusTasksPath,
    onBeforeOpenChat,
    openChatPanel,
    notify,
    t,
  } = input

  applyWorkspaceMode('execute')
  setFocusTasksPath(tasksPath)
  trackCapstoneFunnelStep('auto_launch', { specSlug })

  const depsWithSnapshot: SpecQueueCoordinatorDeps = {
    ...deps,
    getFiles: () => filesSnapshot,
  }

  const result = await enqueueFirstOpenSpecTaskViaRuntime({ tasksPath, language }, depsWithSnapshot)
  if (!result.ok) {
    if (result.reason === 'missing-file') {
      notify('error', t('spec.host.missingTasks.title'), t('spec.host.missingTasks.detail', { path: tasksPath }))
    } else {
      notify('info', t('spec.host.noOpenTask.title'), t('spec.host.noOpenTask.detail'))
    }
    return
  }
  if (!result.accepted) {
    notify('error', t('intent.grounding.title'), result.pauseReason ?? t('runtime.queuePaused.detail'))
    return
  }

  recordCapstoneFunnelMetric('run-tasks', specSlug)
  onBeforeOpenChat()
  useIDEStore.setState(patchOpenChatPanel())
  openChatPanel()
  notify('success', t('capstone.launch.queued.title'), t('capstone.launch.queued.detail', { task: result.taskText }))
}
