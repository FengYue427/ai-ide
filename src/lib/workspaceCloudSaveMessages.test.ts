import { describe, expect, it } from 'vitest'
import type { TranslateFn } from '../i18n'
import { workspaceCloudSaveToast } from './workspaceCloudSaveMessages'

const t = ((key: string) => key) as TranslateFn

describe('workspaceCloudSaveToast', () => {
  it('suggests upgrade on storage limit', () => {
    const toast = workspaceCloudSaveToast(
      { ok: false, reason: 'storage_limit_reached', limitGb: 5 },
      t,
    )
    expect(toast?.suggestUpgrade).toBe(true)
    expect(toast?.title).toBe('workspace.cloudSave.storageLimitTitle')
  })
})
