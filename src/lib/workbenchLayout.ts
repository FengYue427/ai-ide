/**
 * Workbench shell layout rules (v1.2.2 F1).
 * @see docs/ADR_V1.2_WORKBENCH_SHELL.md
 */

export type WorkbenchAuxiliarySlot = 'none' | 'search' | 'preview' | 'codeReview' | 'performance'

export type WorkbenchUiFlags = {
  showSearchPanel: boolean
  showPreview: boolean
  showCodeReview: boolean
  showPerformance: boolean
  showChatPanel: boolean
  showGitPanel: boolean
}

const AUXILIARY_OFF: Pick<
  WorkbenchUiFlags,
  'showSearchPanel' | 'showPreview' | 'showCodeReview' | 'showPerformance'
> = {
  showSearchPanel: false,
  showPreview: false,
  showCodeReview: false,
  showPerformance: false,
}

const RIGHT_OFF: Pick<WorkbenchUiFlags, 'showChatPanel' | 'showGitPanel'> = {
  showChatPanel: false,
  showGitPanel: false,
}

export function getActiveAuxiliarySlot(
  flags: Pick<
    WorkbenchUiFlags,
    'showSearchPanel' | 'showPreview' | 'showCodeReview' | 'showPerformance'
  >,
): WorkbenchAuxiliarySlot {
  if (flags.showSearchPanel) return 'search'
  if (flags.showPreview) return 'preview'
  if (flags.showCodeReview) return 'codeReview'
  if (flags.showPerformance) return 'performance'
  return 'none'
}

export function isWorkbenchAuxiliaryOpen(flags: WorkbenchUiFlags): boolean {
  return getActiveAuxiliarySlot(flags) !== 'none'
}

/** Close all auxiliary panels. */
export function patchCloseAuxiliary(): Partial<WorkbenchUiFlags> {
  return { ...AUXILIARY_OFF }
}

/** Open one auxiliary panel; closes other auxiliaries and right dock. */
export function patchOpenAuxiliary(
  slot: Exclude<WorkbenchAuxiliarySlot, 'none'>,
): Partial<WorkbenchUiFlags> {
  return {
    ...AUXILIARY_OFF,
    ...RIGHT_OFF,
    showSearchPanel: slot === 'search',
    showPreview: slot === 'preview',
    showCodeReview: slot === 'codeReview',
    showPerformance: slot === 'performance',
  }
}

/** Toggle an auxiliary slot (close if already active). */
export function patchToggleAuxiliary(
  slot: Exclude<WorkbenchAuxiliarySlot, 'none'>,
  current: Pick<
    WorkbenchUiFlags,
    'showSearchPanel' | 'showPreview' | 'showCodeReview' | 'showPerformance'
  >,
): Partial<WorkbenchUiFlags> {
  const active = getActiveAuxiliarySlot(current)
  if (active === slot) return patchCloseAuxiliary()
  return patchOpenAuxiliary(slot)
}

/** Open right Chat panel; closes Git and all auxiliaries. */
export function patchOpenChatPanel(): Partial<WorkbenchUiFlags> {
  return {
    ...AUXILIARY_OFF,
    showGitPanel: false,
    showChatPanel: true,
  }
}

/** Open right Git panel; closes Chat and all auxiliaries. */
export function patchOpenGitPanel(): Partial<WorkbenchUiFlags> {
  return {
    ...AUXILIARY_OFF,
    showChatPanel: false,
    showGitPanel: true,
  }
}

/** Toggle Git panel; opening clears Chat + auxiliaries. */
export function patchToggleGitPanel(current: Pick<WorkbenchUiFlags, 'showGitPanel'>): Partial<WorkbenchUiFlags> {
  if (current.showGitPanel) return { showGitPanel: false }
  return patchOpenGitPanel()
}
