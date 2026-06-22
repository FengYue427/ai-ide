import type { TranslateFn } from '../i18n'
import type { WorkspaceCloudSaveResult } from '../services/authService'
import { workspaceCloudSaveToast } from './workspaceCloudSaveMessages'
import { useIDEStore } from '../store/ideStore'

export function handleWorkspaceCloudSaveFailure(
  result: WorkspaceCloudSaveResult,
  t: TranslateFn,
  notify?: (kind: 'error' | 'info', title: string, detail?: string) => void,
): void {
  const toast = workspaceCloudSaveToast(result, t)
  if (!toast) return
  notify?.(toast.kind, toast.title, toast.detail)
  if (toast.suggestUpgrade) {
    useIDEStore.getState().setShowSubscriptionModal(true)
  }
}
