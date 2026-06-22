import { useCallback } from 'react'
import { useI18n } from '../i18n'
import { patchOpenChatPanel } from '../lib/workbenchLayout'
import {
  enqueueFirstOpenSpecTaskViaRuntime,
  findFirstRunnableSpecTasksPath,
} from '../services/specTaskExecutionService'
import { useIDEStore } from '../store/ideStore'
import type { ToastKind } from '../components/FeedbackCenter'
import { useSpecQueueCoordinatorDeps } from './useSpecQueueCoordinatorDeps'

export interface SpecTaskNotify {
  (kind: ToastKind, title: string, detail?: string): void
}

export interface RunFirstOpenSpecTaskOptions {
  closeSettings?: boolean
  closeStudio?: boolean
  onBeforeOpenChat?: () => void
}

/**
 * Unified Spec task execution: Runtime queue + user feedback + open Chat.
 */
export function useSpecTaskActions(notify: SpecTaskNotify) {
  const { language, t } = useI18n()
  const specQueueDeps = useSpecQueueCoordinatorDeps()
  const setRightPanelView = useIDEStore((s) => s.setRightPanelView)

  const openChatAfterEnqueue = useCallback(() => {
    useIDEStore.setState(patchOpenChatPanel())
    setRightPanelView('chat')
  }, [setRightPanelView])

  const runFirstOpenSpecTask = useCallback(
    (tasksPath: string, options?: RunFirstOpenSpecTaskOptions) => {
      void enqueueFirstOpenSpecTaskViaRuntime({ tasksPath, language }, specQueueDeps).then((result) => {
        if (!result.ok) {
          if (result.reason === 'missing-file') {
            notify(
              'error',
              t('spec.host.missingTasks.title'),
              t('spec.host.missingTasks.detail', { path: tasksPath }),
            )
            return
          }
          notify('info', t('spec.host.noOpenTask.title'), t('spec.host.noOpenTask.detail'))
          return
        }
        if (!result.accepted) {
          notify(
            'error',
            t('intent.grounding.title'),
            result.pauseReason ?? t('runtime.queuePaused.detail'),
          )
          return
        }
        options?.onBeforeOpenChat?.()
        openChatAfterEnqueue()
      })
    },
    [language, notify, openChatAfterEnqueue, specQueueDeps, t],
  )

  const runFirstRunnableSpecTask = useCallback(
    (options?: RunFirstOpenSpecTaskOptions) => {
      const tasksPath = findFirstRunnableSpecTasksPath(specQueueDeps.getFiles())
      if (!tasksPath) {
        notify('info', t('spec.host.noOpenTask.title'), t('spec.host.noRunnableSpec.detail'))
        return
      }
      runFirstOpenSpecTask(tasksPath, options)
    },
    [notify, runFirstOpenSpecTask, specQueueDeps, t],
  )

  return {
    specQueueDeps,
    runFirstOpenSpecTask,
    runFirstRunnableSpecTask,
    openChatAfterEnqueue,
  }
}
