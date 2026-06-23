import { useEffect } from 'react'
import { isBackgroundAgentEnabled } from '../lib/backgroundAgentFeatures'
import type { ToastKind } from '../components/FeedbackCenter'
import { useI18n } from '../i18n'
import { processBackgroundJobsSnapshot } from '../services/backgroundJobCompletionTracker'
import { maybeAutoMarkPlanStepFromJob } from '../services/backgroundJobPlanBackfillService'
import { handleAutopilotBackgroundWatchOnJobTerminal } from '../services/specBackgroundAutopilotWatchCoordinator'
import { listBackgroundJobs } from '../services/backgroundJobsApiService'
import { markWorkspaceHydrated } from '../services/workspaceSession'
import { useIDEStore } from '../store/ideStore'

const POLL_MS = 10_000

export function useBackgroundJobsTracker(
  notify: (kind: ToastKind, title: string, detail?: string) => void,
): void {
  const { t, language } = useI18n()
  const currentUser = useIDEStore((s) => s.currentUser)
  const setBackgroundJobsActiveCount = useIDEStore((s) => s.setBackgroundJobsActiveCount)
  const enabled = isBackgroundAgentEnabled()

  useEffect(() => {
    if (!enabled || !currentUser) {
      setBackgroundJobsActiveCount(0)
      return
    }

    let cancelled = false

    const tick = async () => {
      const { jobs } = await listBackgroundJobs(50)
      if (cancelled) return
      const active = processBackgroundJobsSnapshot(jobs, {
        notify,
        t,
        onTerminal: (job) => {
          const state = useIDEStore.getState()
          maybeAutoMarkPlanStepFromJob(
            state.files,
            job,
            (nextFiles) => {
              state.setFiles(nextFiles)
              markWorkspaceHydrated()
            },
            notify,
            t,
          )
          void handleAutopilotBackgroundWatchOnJobTerminal(job, {
            files: useIDEStore.getState().files,
            setFiles: (nextFiles) => {
              useIDEStore.getState().setFiles(nextFiles)
              markWorkspaceHydrated()
            },
            watch: useIDEStore.getState().autopilotBackgroundWatch,
            setWatch: useIDEStore.getState().setAutopilotBackgroundWatch,
            workspaceKey: useIDEStore.getState().activeRootId,
            language,
            t,
          })
        },
      })
      setBackgroundJobsActiveCount(active)
    }

    void tick()
    const timer = window.setInterval(() => void tick(), POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      setBackgroundJobsActiveCount(0)
    }
  }, [currentUser, enabled, language, notify, setBackgroundJobsActiveCount, t])
}
