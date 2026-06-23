import type { FileItem } from '../types/file'
import { getLinkedWorkspaceShareId } from './shareWorkspaceLink'
import { isBackgroundAgentEnabled } from './backgroundAgentFeatures'
import { evaluateAutonomyPolicy, type AutonomyPolicyInput, type AutonomyPolicyResult } from './autonomyPolicy'
import { buildIntentLinkageGraph, type IntentLinkageGraph } from '../services/intentOs/intentLinkageGraphService'
import { useIDEStore } from '../store/ideStore'

export interface LinkageAutonomyContext {
  tasksPath: string | null
  openTaskCount: number
  gitModifiedCount: number
  queueBusy: boolean
  groundingBlocked: boolean
  backgroundAgentEnabled: boolean
  quotaBlocked: boolean
  goalText: string | null
  decomposedTasks: string[]
  autopilotActive: boolean
  shareLinked: boolean
  workspaceMode: string
  backgroundJobsActive: number
  driftWarn: boolean
}

export function collectLinkageAutonomyContext(input: {
  files: FileItem[]
  tasksPath: string | null
  openTaskCount: number
  gitModifiedCount: number
  queueBusy: boolean
  quotaBlocked: boolean
  workspaceKey?: string | null
}): LinkageAutonomyContext {
  const state = useIDEStore.getState()
  const focus = input.tasksPath ?? state.intentShellFocusTasksPath
  const focusKey = focus?.replace(/\\/g, '/') ?? null
  const driftReport = focusKey ? state.specDriftReports[focusKey] : null
  const goalDrive = state.autopilotGoalDrive
  return {
    tasksPath: focus,
    openTaskCount: input.openTaskCount,
    gitModifiedCount: input.gitModifiedCount,
    queueBusy: input.queueBusy,
    groundingBlocked: Boolean(state.lastGroundingBlock),
    backgroundAgentEnabled: isBackgroundAgentEnabled(),
    quotaBlocked: input.quotaBlocked,
    goalText: goalDrive?.goal ?? null,
    decomposedTasks: goalDrive?.decomposedTasks ?? [],
    autopilotActive: Boolean(
      state.autopilotLoop?.active ||
        state.autopilotBackgroundWatch?.active ||
        goalDrive?.active,
    ),
    shareLinked: Boolean(focus && getLinkedWorkspaceShareId(input.workspaceKey ?? state.activeRootId)),
    workspaceMode: state.workspaceMode,
    backgroundJobsActive: state.backgroundJobsActiveCount ?? 0,
    driftWarn: driftReport?.severity === 'warn',
  }
}

export function buildLinkageGraphFromContext(ctx: LinkageAutonomyContext, files: FileItem[]): IntentLinkageGraph {
  return buildIntentLinkageGraph({
    files,
    focusTasksPath: ctx.tasksPath,
    workspaceMode: ctx.workspaceMode,
    gitModifiedCount: ctx.gitModifiedCount,
    queueBusy: ctx.queueBusy,
    backgroundJobsActive: ctx.backgroundJobsActive,
    goalText: ctx.goalText,
    decomposedTasks: ctx.decomposedTasks,
    autopilotActive: ctx.autopilotActive,
    shareLinked: ctx.shareLinked,
  })
}

export function evaluateLinkageAutonomy(
  ctx: LinkageAutonomyContext,
  extra?: Partial<AutonomyPolicyInput>,
): AutonomyPolicyResult {
  return evaluateAutonomyPolicy({
    tasksPath: ctx.tasksPath,
    openTaskCount: ctx.openTaskCount,
    gitModifiedCount: ctx.gitModifiedCount,
    queueBusy: ctx.queueBusy,
    groundingBlocked: ctx.groundingBlocked,
    backgroundAgentEnabled: ctx.backgroundAgentEnabled,
    quotaBlocked: ctx.quotaBlocked,
    driftWarn: ctx.driftWarn,
    ...extra,
  })
}
