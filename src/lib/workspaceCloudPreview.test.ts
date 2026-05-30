import { describe, expect, it } from 'vitest'
import { previewWorkspaceCloudSync } from './workspaceCloudPreview'

describe('previewWorkspaceCloudSync', () => {
  it('reports full sync when all files eligible', () => {
    const preview = previewWorkspaceCloudSync([{ name: 'a.ts', content: 'ok' }])
    expect(preview.total).toBe(1)
    expect(preview.syncable).toBe(1)
    expect(preview.hasOmissions).toBe(false)
  })

  it('reports partial when binary skipped', () => {
    const preview = previewWorkspaceCloudSync([
      { name: 'a.png', content: 'x' },
      { name: 'b.ts', content: 'ok' },
    ])
    expect(preview.syncable).toBe(1)
    expect(preview.hasOmissions).toBe(true)
  })
})
