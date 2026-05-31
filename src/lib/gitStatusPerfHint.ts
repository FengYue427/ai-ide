/** Show Git status performance hint when change count exceeds this threshold. */
export const GIT_STATUS_PERF_HINT_THRESHOLD = 100

export function shouldShowGitStatusPerfHint(changeCount: number): boolean {
  return changeCount >= GIT_STATUS_PERF_HINT_THRESHOLD
}
