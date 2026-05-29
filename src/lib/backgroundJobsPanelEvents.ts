/** Dispatched when user clicks a background-job toast or desktop notification. */
export const OPEN_BACKGROUND_JOBS_PANEL_EVENT = 'aide:open-background-jobs'

export function dispatchOpenBackgroundJobsPanel(): void {
  window.dispatchEvent(new CustomEvent(OPEN_BACKGROUND_JOBS_PANEL_EVENT))
}
