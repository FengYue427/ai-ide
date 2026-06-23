export interface AutopilotGoalDriveState {
  active: boolean
  goal: string
  tasksPath: string
  startedAt: string
  mode: 'foreground' | 'background'
  specCreated: boolean
  decomposedTasks?: string[]
  decomposeSource?: 'llm' | 'heuristic'
}

export function createAutopilotGoalDriveState(input: {
  goal: string
  tasksPath: string
  mode: 'foreground' | 'background'
  specCreated: boolean
  decomposedTasks?: string[]
  decomposeSource?: 'llm' | 'heuristic'
}): AutopilotGoalDriveState {
  return {
    active: true,
    goal: input.goal,
    tasksPath: input.tasksPath,
    startedAt: new Date().toISOString(),
    mode: input.mode,
    specCreated: input.specCreated,
    decomposedTasks: input.decomposedTasks,
    decomposeSource: input.decomposeSource,
  }
}

export function stopAutopilotGoalDriveState(
  state: AutopilotGoalDriveState,
): AutopilotGoalDriveState {
  return { ...state, active: false }
}
