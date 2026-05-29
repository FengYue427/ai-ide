import type { ConfirmRequest } from '../components/FeedbackCenter'
import { listAideEditorFiles, syncAideFilesToWorkspace } from './aideWorkspaceSyncService'

interface EditorFileLike {
  name: string
  content: string
  language: string
}

type NotifyFn = (kind: 'success' | 'error' | 'info', title: string, detail?: string) => void
export type PlanHostTranslateFn = (key: string, params?: Record<string, string | number>) => string

export async function runAideWorkspaceSyncWithNotify(
  files: EditorFileLike[],
  notify: NotifyFn,
  t: PlanHostTranslateFn,
): Promise<{ synced: number; failed: number }> {
  const aideFiles = listAideEditorFiles(files)
  if (aideFiles.length === 0) {
    notify('info', t('plan.host.syncNothing.title'), t('plan.host.syncNothing.detail'))
    return { synced: 0, failed: 0 }
  }
  const result = await syncAideFilesToWorkspace(files)
  if (result.synced === 0) {
    notify('error', t('plan.host.syncFailed.title'), result.errors[0] ?? t('plan.host.syncFailed.detail'))
    return { synced: 0, failed: result.failed }
  }
  notify(
    'success',
    t('plan.host.syncSuccess.title'),
    t('plan.host.syncSuccess.detail', {
      synced: result.synced,
      failedSuffix:
        result.failed > 0 ? t('plan.host.syncSuccess.failedSuffix', { failed: result.failed }) : '',
    }),
  )
  return { synced: result.synced, failed: result.failed }
}

export async function offerSyncAideAfterPlanWrite(
  files: EditorFileLike[],
  requestConfirm: (request: ConfirmRequest) => Promise<boolean>,
  notify: NotifyFn,
  t: PlanHostTranslateFn,
): Promise<boolean> {
  if (listAideEditorFiles(files).length === 0) return false
  const ok = await requestConfirm({
    title: t('plan.syncAfterWrite.confirm.title'),
    message: t('plan.syncAfterWrite.confirm.message'),
    confirmText: t('plan.syncAfterWrite.confirm.confirm'),
  })
  if (!ok) return false
  const result = await runAideWorkspaceSyncWithNotify(files, notify, t)
  return result.synced > 0
}
