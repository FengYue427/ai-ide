import { useEffect } from 'react'
import { isBackgroundAgentEnabled } from '../lib/backgroundAgentFeatures'
import type { ToastKind } from '../components/FeedbackCenter'
import { useI18n } from '../i18n'
import { processBackgroundJobsSnapshot } from '../services/backgroundJobCompletionTracker'
import { listBackgroundJobs } from '../services/backgroundJobsApiService'
import { useIDEStore } from '../store/ideStore'

const POLL_MS = 10_000

export function useBackgroundJobsTracker(
  notify: (kind: ToastKind, title: string, detail?: string) => void,
): void {
  const { t } = useI18n()
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
      const active = processBackgroundJobsSnapshot(jobs, { notify, t })
      setBackgroundJobsActiveCount(active)
    }

    void tick()
    const timer = window.setInterval(() => void tick(), POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      setBackgroundJobsActiveCount(0)
    }
  }, [currentUser, enabled, notify, setBackgroundJobsActiveCount, t])
}
