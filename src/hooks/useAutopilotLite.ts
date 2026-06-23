import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildSpecStatusSummary } from '../lib/specStatusSummary'
import { isTierCEnabled } from '../lib/intentOsTierC'
import { suggestNextSpecTask, countOpenSpecTasks } from '../services/intentOs/autopilotLiteService'
import { buildRuntimeStatePreview } from '../services/runtime/runtimeStatePreview'
import { consumeAutopilotRunClient, fetchAutopilotQuota, type AutopilotQuota } from '../services/autopilotUsageService'
import { evaluateAutonomyPolicy } from '../lib/autonomyPolicy'
import { isBackgroundAgentEnabled } from '../lib/backgroundAgentFeatures'
import { useIDEStore } from '../store/ideStore'
import {
  createAutopilotLoopState,
  evaluateAutopilotLoopStep,
  formatAutopilotLoopProgress,
  stopAutopilotLoopState,
  type AutopilotLoopStopReason,
} from '../lib/autopilotLoop'
import { publishAutopilotLoopEvent } from '../services/runtime/runtimeActivityPublishers'
import { emitAideLinkEvent } from '../lib/aideLinkBus'
import { emitLinkageAutopilot } from '../lib/linkageLinkEvents'
import { trackEvent } from '../lib/observability'

export function useAutopilotLite(
  runFirstOpenSpecTask: (tasksPath: string) => void,
  options?: { gitModifiedCount?: number },
) {
  const files = useIDEStore((s) => s.files)
  const focusTasksPath = useIDEStore((s) => s.intentShellFocusTasksPath)
  const queuedSpecBackfill = useIDEStore((s) => s.queuedSpecBackfill)
  const verifyingSpecBackfill = useIDEStore((s) => s.verifyingSpecBackfill)
  const failedSpecExecution = useIDEStore((s) => s.failedSpecExecution)
  const queuedChatPrompt = useIDEStore((s) => s.queuedChatPrompt)
  const queuedSpecExecutions = useIDEStore((s) => s.queuedSpecExecutions)
  const autopilotLoop = useIDEStore((s) => s.autopilotLoop)
  const setAutopilotLoop = useIDEStore((s) => s.setAutopilotLoop)
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const currentUser = useIDEStore((s) => s.currentUser)
  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)
  const [quota, setQuota] = useState<AutopilotQuota | null>(null)

  const tasksPath = useMemo(() => {
    const preview = buildRuntimeStatePreview(files)
    return (
      focusTasksPath ??
      preview.activeSpecPath ??
      buildSpecStatusSummary(files).runnableTasksPath ??
      null
    )
  }, [files, focusTasksPath])

  const queueBusy = Boolean(
    queuedSpecBackfill ||
      verifyingSpecBackfill ||
      failedSpecExecution ||
      queuedChatPrompt ||
      queuedSpecExecutions.length > 0,
  )

  const suggestion = useMemo(() => {
    if (!isTierCEnabled('autopilotLite') || !tasksPath || queueBusy) return null
    return suggestNextSpecTask(files, tasksPath)
  }, [files, queueBusy, tasksPath])

  const refreshQuota = useCallback(async () => {
    const next = await fetchAutopilotQuota(Boolean(currentUser), currentPlan)
    setQuota(next)
  }, [currentPlan, currentUser])

  useEffect(() => {
    void refreshQuota()
  }, [refreshQuota])

  const stopLoop = useCallback(
    (reason: AutopilotLoopStopReason, stepsCompleted?: number) => {
      const loop = useIDEStore.getState().autopilotLoop
      if (!loop?.active && reason !== 'paused') return
      const stopped = loop ? stopAutopilotLoopState(loop, reason, stepsCompleted) : null
      setAutopilotLoop(stopped?.active === false ? stopped : null)
      publishAutopilotLoopEvent('stop', reason, {
        ...(loop?.tasksPath ? { tasksPath: loop.tasksPath } : {}),
        stepsCompleted: stopped?.stepsCompleted ?? 0,
      })
      emitLinkageAutopilot({
        action: reason === 'paused' ? 'pause' : 'stop',
        channel: 'loop',
        tasksPath: loop?.tasksPath,
      })
      trackEvent('autopilot.loop_stop', { reason, steps: stopped?.stepsCompleted ?? 0 })
    },
    [setAutopilotLoop],
  )

  const runNext = useCallback(async (): Promise<boolean> => {
    if (!suggestion) return false
    const consumed = await consumeAutopilotRunClient(Boolean(currentUser), currentPlan)
    if (!consumed.ok) {
      emitAideLinkEvent('entitlement-blocked', { feature: 'autopilot', reason: 'dailyLimit' })
      setShowSubscriptionModal(true)
      await refreshQuota()
      if (useIDEStore.getState().autopilotLoop?.active) {
        stopLoop('quota')
      }
      return false
    }
    await refreshQuota()
    runFirstOpenSpecTask(suggestion.tasksPath)
    publishAutopilotLoopEvent('step', suggestion.taskText.slice(0, 80), {
      tasksPath: suggestion.tasksPath,
    })
    return true
  }, [
    currentPlan,
    currentUser,
    refreshQuota,
    runFirstOpenSpecTask,
    setShowSubscriptionModal,
    stopLoop,
    suggestion,
  ])

  const startLoop = useCallback(async (tasksPathOverride?: string) => {
    const path = tasksPathOverride ?? tasksPath
    if (!path) return
    const latestFiles = tasksPathOverride ? useIDEStore.getState().files : files
    const openAtStart = countOpenSpecTasks(latestFiles, path)
    if (openAtStart <= 0) return

    const state = useIDEStore.getState()
    const driftKey = path.replace(/\\/g, '/')
    const driftWarn = state.specDriftReports[driftKey]?.severity === 'warn'

    const policy = evaluateAutonomyPolicy({
      tasksPath: path,
      openTaskCount: openAtStart,
      gitModifiedCount: options?.gitModifiedCount ?? 0,
      queueBusy,
      groundingBlocked: Boolean(state.lastGroundingBlock),
      backgroundAgentEnabled: isBackgroundAgentEnabled(),
      quotaBlocked: quota ? !quota.allowed && !quota.unlimited : false,
      driftWarn,
    })
    if (policy.mode === 'pause' || policy.mode === 'hint-only') {
      publishAutopilotLoopEvent('stop', policy.mode, { tasksPath: path }, policy.reasons)
      return
    }

    const loop = createAutopilotLoopState(path, openAtStart)
    setAutopilotLoop(loop)
    publishAutopilotLoopEvent('start', path, { open: openAtStart }, policy.reasons)
    emitLinkageAutopilot({
      action: 'start',
      channel: 'loop',
      tasksPath: path,
      mode: policy.mode,
      because: policy.reasons.map((r) => r.id),
    })
    trackEvent('autopilot.loop_start', { tasksPath: path, open: openAtStart })
    loopArmedRef.current = false

    if (tasksPathOverride) {
      const consumed = await consumeAutopilotRunClient(Boolean(currentUser), currentPlan)
      if (!consumed.ok) {
        emitAideLinkEvent('entitlement-blocked', { feature: 'autopilot', reason: 'dailyLimit' })
        setShowSubscriptionModal(true)
        await refreshQuota()
        setAutopilotLoop(null)
        return
      }
      await refreshQuota()
      runFirstOpenSpecTask(path)
      const preview = suggestNextSpecTask(latestFiles, path)?.taskText.slice(0, 80) ?? path
      publishAutopilotLoopEvent('step', preview, { tasksPath: path }, policy.reasons)
      return
    }

    if (!suggestion) {
      setAutopilotLoop(null)
      return
    }
    const ok = await runNext()
    if (!ok && useIDEStore.getState().autopilotLoop?.active) {
      setAutopilotLoop(null)
    }
  }, [
    currentPlan,
    currentUser,
    files,
    refreshQuota,
    runFirstOpenSpecTask,
    runNext,
    setAutopilotLoop,
    setShowSubscriptionModal,
    quota,
    queueBusy,
    options?.gitModifiedCount,
    suggestion,
    tasksPath,
  ])

  const pauseLoop = useCallback(() => {
    stopLoop('paused')
    setAutopilotLoop(null)
  }, [setAutopilotLoop, stopLoop])

  const loopArmedRef = useRef(false)
  const wasBusyRef = useRef(false)
  const continueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (continueTimerRef.current) clearTimeout(continueTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const loop = autopilotLoop
    if (!loop?.active) {
      wasBusyRef.current = queueBusy
      loopArmedRef.current = false
      return
    }

    if (failedSpecExecution) {
      stopLoop('failed')
      return
    }

    const busy = queueBusy
    if (wasBusyRef.current && !busy && loopArmedRef.current) {
      const remaining = countOpenSpecTasks(files, loop.tasksPath)
      const decision = evaluateAutopilotLoopStep({ loop, remainingOpenTasks: remaining })
      if (decision.action === 'stop') {
        stopLoop(decision.reason, loop.stepsCompleted + 1)
        setAutopilotLoop(null)
        return
      }

      const nextLoop = { ...loop, stepsCompleted: loop.stepsCompleted + 1 }
      setAutopilotLoop(nextLoop)
      if (continueTimerRef.current) clearTimeout(continueTimerRef.current)
      continueTimerRef.current = setTimeout(() => {
        void runNext().then((ok) => {
          if (!ok) setAutopilotLoop(null)
        })
      }, 400)
    }

    if (busy) loopArmedRef.current = true
    wasBusyRef.current = busy
  }, [autopilotLoop, failedSpecExecution, files, queueBusy, runNext, setAutopilotLoop, stopLoop])

  const loopProgress = useMemo(() => {
    if (!autopilotLoop?.active) return null
    const remaining = countOpenSpecTasks(files, autopilotLoop.tasksPath)
    return formatAutopilotLoopProgress(autopilotLoop, remaining)
  }, [autopilotLoop, files])

  return {
    enabled: isTierCEnabled('autopilotLite'),
    suggestion,
    openTaskCount: tasksPath ? countOpenSpecTasks(files, tasksPath) : 0,
    runNext: () => {
      void runNext()
    },
    startLoop: (tasksPathOverride?: string) => {
      void startLoop(tasksPathOverride)
    },
    pauseLoop,
    loopActive: Boolean(autopilotLoop?.active),
    loopProgress,
    tasksPath,
    quota,
    quotaBlocked: quota ? !quota.allowed && !quota.unlimited : false,
  }
}
