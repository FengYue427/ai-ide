import { useCallback, useState } from 'react'
import { useI18n } from '../i18n'
import { isBackgroundAgentEnabled } from '../lib/backgroundAgentFeatures'
import { isTierCEnabled } from '../lib/intentOsTierC'
import { evaluateAutonomyPolicy } from '../lib/autonomyPolicy'
import {
  createAutopilotGoalDriveState,
  stopAutopilotGoalDriveState,
} from '../lib/autopilotGoalDrive'
import { emitLinkageAutopilot, emitLinkageGraphChanged } from '../lib/linkageLinkEvents'
import { decomposeGoalForLinkage } from '../services/intentOs/goalDriveLlmDecompose'
import { prepareGoalDrivenWorkspace } from '../services/intentOs/goalDriveAutopilotService'
import { summarizeIntentLinkageGraph, buildIntentLinkageGraph } from '../services/intentOs/intentLinkageGraphService'
import { publishAutopilotGoalEvent } from '../services/runtime/runtimeActivityPublishers'
import { markWorkspaceHydrated } from '../services/workspaceSession'
import { trackEvent } from '../lib/observability'
import { useIDEStore } from '../store/ideStore'

type StartLoopFn = (tasksPath?: string) => void | Promise<void>
type StartWatchFn = (tasksPath?: string) => void | Promise<void>

export function useAutopilotGoalDrive(input: {
  startLoop: StartLoopFn
  startBackgroundWatch: StartWatchFn
  pauseLoop: () => void
  pauseBackgroundWatch: () => void
  loopActive: boolean
  backgroundWatchActive: boolean
  quotaBlocked: boolean
  gitModifiedCount: number
}) {
  const { language } = useI18n()
  const goalDrive = useIDEStore((s) => s.autopilotGoalDrive)
  const setGoalDrive = useIDEStore((s) => s.setAutopilotGoalDrive)
  const aiConfig = useIDEStore((s) => s.aiConfig)
  const currentUser = useIDEStore((s) => s.currentUser)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const stopGoalDrive = useCallback(() => {
    const current = useIDEStore.getState().autopilotGoalDrive
    if (!current?.active) return
    const stopped = stopAutopilotGoalDriveState(current)
    setGoalDrive(stopped.active ? stopped : null)
    publishAutopilotGoalEvent('stop', current.goal.slice(0, 80), { tasksPath: current.tasksPath })
    emitLinkageAutopilot({ action: 'stop', channel: 'goal-drive', tasksPath: current.tasksPath })
    trackEvent('autopilot.goal_stop', { tasksPath: current.tasksPath })
  }, [setGoalDrive])

  const startGoalDrive = useCallback(
    async (goal: string) => {
      if (!isTierCEnabled('autopilotGoalDrive') || input.quotaBlocked) return
      setBusy(true)
      try {
        const state = useIDEStore.getState()
        const decomposed = await decomposeGoalForLinkage(goal, language, aiConfig, Boolean(currentUser))
        const prepared = prepareGoalDrivenWorkspace(state.files, goal, language, {
          taskLines: decomposed.source === 'llm' ? decomposed.tasks : undefined,
        })
        if (!prepared.ok) return

        state.setFiles(prepared.files)
        markWorkspaceHydrated()
        state.setIntentShellFocusTasksPath(prepared.tasksPath)
        state.setWorkspaceMode('execute')

        const focusKey = prepared.tasksPath.replace(/\\/g, '/')
        const driftWarn = state.specDriftReports[focusKey]?.severity === 'warn'

        const policy = evaluateAutonomyPolicy({
          tasksPath: prepared.tasksPath,
          openTaskCount: prepared.openTasks,
          gitModifiedCount: input.gitModifiedCount,
          queueBusy: false,
          groundingBlocked: Boolean(state.lastGroundingBlock),
          backgroundAgentEnabled: isBackgroundAgentEnabled(),
          quotaBlocked: input.quotaBlocked,
          goalDrive: true,
          specCreated: prepared.created,
          driftWarn,
        })

        if (policy.mode === 'pause' || policy.mode === 'hint-only') {
          publishAutopilotGoalEvent(
            'stop',
            policy.mode,
            { tasksPath: prepared.tasksPath },
            policy.reasons,
          )
          emitLinkageAutopilot({
            action: 'pause',
            channel: 'goal-drive',
            tasksPath: prepared.tasksPath,
            mode: policy.mode,
          })
          return
        }

        const drive = createAutopilotGoalDriveState({
          goal,
          tasksPath: prepared.tasksPath,
          mode: policy.mode === 'background' ? 'background' : 'foreground',
          specCreated: prepared.created,
          decomposedTasks: decomposed.tasks,
          decomposeSource: decomposed.source,
        })
        setGoalDrive(drive)

        const graphStats = summarizeIntentLinkageGraph(
          buildIntentLinkageGraph({
            files: prepared.files,
            focusTasksPath: prepared.tasksPath,
            workspaceMode: 'execute',
            gitModifiedCount: input.gitModifiedCount,
            queueBusy: false,
            goalText: goal,
            decomposedTasks: decomposed.tasks,
            autopilotActive: true,
          }),
        )
        emitLinkageGraphChanged({
          tasksPath: prepared.tasksPath,
          nodes: graphStats.baseNodes + graphStats.overlayNodes,
          edges: graphStats.baseEdges + graphStats.overlayEdges,
          openTasks: graphStats.openTasks,
          source: 'goal-drive',
        })
        emitLinkageAutopilot({
          action: 'start',
          channel: 'goal-drive',
          tasksPath: prepared.tasksPath,
          mode: drive.mode,
          because: policy.reasons.map((r) => r.id),
        })
        publishAutopilotGoalEvent(
          'start',
          goal.slice(0, 120),
          {
            tasksPath: prepared.tasksPath,
            created: prepared.created,
            mode: drive.mode,
            open: prepared.openTasks,
          },
          policy.reasons,
        )
        trackEvent('autopilot.goal_start', {
          tasksPath: prepared.tasksPath,
          created: prepared.created,
          mode: drive.mode,
        })

        if (policy.mode === 'background') {
          await input.startBackgroundWatch(prepared.tasksPath)
        } else {
          await input.startLoop(prepared.tasksPath)
        }
        setDialogOpen(false)
      } finally {
        setBusy(false)
      }
    },
    [input, language, setGoalDrive, aiConfig, currentUser],
  )

  const pauseGoalDrive = useCallback(() => {
    if (input.loopActive) input.pauseLoop()
    if (input.backgroundWatchActive) input.pauseBackgroundWatch()
    stopGoalDrive()
  }, [input, stopGoalDrive])

  return {
    enabled: isTierCEnabled('autopilotGoalDrive'),
    goalDriveActive: Boolean(goalDrive?.active),
    goalDrive,
    dialogOpen,
    setDialogOpen,
    busy,
    startGoalDrive,
    pauseGoalDrive,
    openDialog: () => setDialogOpen(true),
  }
}
