/**
 * Workbench shell z-index scale (v1.2.2 F2).
 * CSS mirror: src/styles/layers.css — keep in sync.
 * @see docs/ADR_V1.2_WORKBENCH_SHELL.md
 */
export const Z = {
  base: 0,
  sticky: 1,
  local: 2,
  dropdown: 100,
  workbenchFloat: 150,
  modal: 1000,
  modalElevated: 1100,
  command: 2500,
  toast: 3000,
  confirm: 4000,
  fatal: 5000,
} as const

export type ZLayer = (typeof Z)[keyof typeof Z]

/** Monotonic stack for tests and tooling. */
export const Z_STACK_ORDER: readonly ZLayer[] = [
  Z.base,
  Z.sticky,
  Z.local,
  Z.dropdown,
  Z.workbenchFloat,
  Z.modal,
  Z.modalElevated,
  Z.command,
  Z.toast,
  Z.confirm,
  Z.fatal,
]

export function isZAbove(a: ZLayer, b: ZLayer): boolean {
  return Z_STACK_ORDER.indexOf(a) > Z_STACK_ORDER.indexOf(b)
}
