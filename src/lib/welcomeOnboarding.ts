const STORAGE_KEY = 'aide-welcome-onboarding-v114'

export function shouldShowWelcomeOnboarding(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) !== '1'
}

export function dismissWelcomeOnboarding(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, '1')
}

/** Large workspace threshold aligned with FileSidebar collapse (F1). */
export const LARGE_WORKSPACE_FILE_HINT = 250

export function shouldShowWorkspacePerformanceHint(fileCount: number): boolean {
  return fileCount >= LARGE_WORKSPACE_FILE_HINT
}
