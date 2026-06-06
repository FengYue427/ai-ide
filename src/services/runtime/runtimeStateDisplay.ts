/** v1.5.3 — localized runtime-state summary for settings / spec catalog. */

import type { TranslationKey } from '../../i18n/translations'
import { specNameFromTasksPath, type RuntimeStateDocument } from './runtimeState'

export type RuntimeStateDisplayTranslator = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string

export function formatRuntimeStateDisplayLines(
  document: RuntimeStateDocument,
  t: RuntimeStateDisplayTranslator,
): string[] {
  const lines: string[] = []

  if (document.activeSpecPath) {
    lines.push(
      t('runtime.state.activeSpec', {
        name: specNameFromTasksPath(document.activeSpecPath),
      }),
    )
  }

  if (document.queueSnapshot) {
    lines.push(
      t('runtime.state.queue', {
        spec: document.queueSnapshot.specPending,
        plan: document.queueSnapshot.planPending,
      }),
    )
  }

  const lastHook = document.lastHookResults?.[document.lastHookResults.length - 1]
  if (lastHook) {
    lines.push(
      t('runtime.state.lastHook', {
        id: lastHook.hookId,
        status: lastHook.status,
      }),
    )
  }

  if (document.updatedAt) {
    lines.push(t('runtime.state.updated', { at: document.updatedAt }))
  }

  return lines
}
