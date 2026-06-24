let workbenchLayoutHydrated = false

export function markWorkbenchLayoutHydrated(): void {
  workbenchLayoutHydrated = true
}

export function isWorkbenchLayoutHydrated(): boolean {
  return workbenchLayoutHydrated
}

/** @internal test helper */
export function resetWorkbenchLayoutHydrated(): void {
  workbenchLayoutHydrated = false
}
