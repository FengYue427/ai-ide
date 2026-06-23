import { useCallback, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { isBackgroundAgentEnabled } from '../lib/backgroundAgentFeatures'
import {
  createAutopilotBackgroundWatchState,
  formatAutopilotBackgroundWatchProgress,
  loadPersistedAutopilotBackgroundWatch,
  persistAutopilotBackgroundWatch,
  stopAutopilotBackgroundWatchState,
  type AutopilotBackgroundWatchStopReason,
} from '../lib/autopilotBackgroundWatch'
import { evaluateAutonomyPolicy } from '../lib/autonomyPolicy'
import { countOpenSpecTasks } from '../services/intentOs/autopilotLiteService'
import { queueNextOpenSpecTaskAsBackgroundJob } from '../services/specBackgroundAutopilotService'
import { publishAutopilotBackgroundEvent } from '../services/runtime/runtimeActivityPublishers'
import { emitLinkageAutopilot } from '../lib/linkageLinkEvents'
import { trackEvent } from '../lib/observability'
import { useIDEStore } from '../store/ideStore'

export function useAutopilotBackgroundWatch(
  tasksPath: string | null,
  options?: { gitModifiedCount?: number; queueBusy?: boolean; quotaBlocked?: boolean },
) {
  const { t, language } = useI18n()
  const files = useIDEStore((s) => s.files)
  const watch = useIDEStore((s) => s.autopilotBackgroundWatch)
  const setWatch = useIDEStore((s) => s.setAutopilotBackgroundWatch)
  const backgroundAgentEnabled = isBackgroundAgentEnabled()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (hydrated) return
    const persisted = loadPersistedAutopilotBackgroundWatch()
    if (persisted) setWatch(persisted)
    setHydrated(true)
  }, [hydrated, setWatch])

  useEffect(() => {
    persistAutopilotBackgroundWatch(watch)
  }, [watch])

  const stopWatch = useCallback(
    (reason: AutopilotBackgroundWatchStopReason) => {
      const current = useIDEStore.getState().autopilotBackgroundWatch
      if (!current?.active && reason !== 'paused') return
      const stopped = current ? stopAutopilotBackgroundWatchState(current, reason) : null
      setWatch(null)
      publishAutopilotBackgroundEvent('stop', reason, {
        ...(current?.tasksPath ? { tasksPath: current.tasksPath } : {}),
        stepsQueued: stopped?.stepsQueued ?? 0,
      })
      emitLinkageAutopilot({
        action: reason === 'paused' ? 'pause' : 'stop',
        channel: 'background',
        tasksPath: current?.tasksPath,
      })
      trackEvent('autopilot.background_stop', { reason, steps: stopped?.stepsQueued ?? 0 })
    },
    [setWatch],
  )

  const startWatch = useCallback(async (tasksPathOverride?: string) => {
    const path = tasksPathOverride ?? tasksPath
    if (!backgroundAgentEnabled || !path) return
    const latestFiles = tasksPathOverride ? useIDEStore.getState().files : files
    const openCount = countOpenSpecTasks(latestFiles, path)
    if (openCount <= 0) return

    const state = useIDEStore.getState()
    const driftKey = path.replace(/\\/g, '/')
    const driftWarn = state.specDriftReports[driftKey]?.severity === 'warn'
    const policy = evaluateAutonomyPolicy({
      tasksPath: path,
      openTaskCount: openCount,
      gitModifiedCount: options?.gitModifiedCount ?? 0,
      queueBusy: options?.queueBusy ?? false,
      groundingBlocked: Boolean(state.lastGroundingBlock),
      backgroundAgentEnabled,
      quotaBlocked: options?.quotaBlocked ?? false,
      driftWarn,
    })
    if (policy.mode !== 'background') {
      publishAutopilotBackgroundEvent('stop', policy.mode, { tasksPath: path }, policy.reasons)
      return
    }

    const next = createAutopilotBackgroundWatchState(path)
    setWatch(next)
    publishAutopilotBackgroundEvent('start', path, { open: openCount }, policy.reasons)
    emitLinkageAutopilot({
      action: 'start',
      channel: 'background',
      tasksPath: path,
      mode: policy.mode,
      because: policy.reasons.map((r) => r.id),
    })
    trackEvent('autopilot.background_start', { tasksPath: path, open: openCount })

    const result = await queueNextOpenSpecTaskAsBackgroundJob(latestFiles, path, {
      language,
      t,
    })

    if (result.skipped === 'no-open-task' || result.skipped === 'missing-file') {
      stopWatch('no-tasks')
      return
    }
    if (result.error || !result.job) {
      stopWatch('unavailable')
      return
    }

    setWatch({
      ...next,
      stepsQueued: 1,
      lastJobId: result.job.id,
    })
    publishAutopilotBackgroundEvent('step', result.taskText?.slice(0, 80) ?? '', {
      tasksPath: path,
      jobId: result.job.id,
    })
  }, [backgroundAgentEnabled, files, language, options?.gitModifiedCount, options?.queueBusy, options?.quotaBlocked, stopWatch, setWatch, t, tasksPath])

  const pauseWatch = useCallback(() => {
    stopWatch('paused')
    setWatch(null)
  }, [setWatch, stopWatch])

  const progress = useMemo(() => {
    if (!watch?.active || !watch.tasksPath) return null
    const remaining = countOpenSpecTasks(files, watch.tasksPath)
    return formatAutopilotBackgroundWatchProgress(watch, remaining)
  }, [files, watch])

  return {
    enabled: backgroundAgentEnabled,
    watchActive: Boolean(watch?.active),
    startWatch: (tasksPathOverride?: string) => {
      void startWatch(tasksPathOverride)
    },
    pauseWatch,
    progress,
    tasksPath: watch?.tasksPath ?? tasksPath,
  }
}
