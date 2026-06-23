import { describe, expect, it } from 'vitest'
import { linkageAideLinkActivityLabel } from './linkageLinkEvents'
import { createTranslator } from '../i18n'

describe('linkageLinkEvents', () => {
  const t = createTranslator('zh-CN')

  it('labels linkage-autopilot start', () => {
    const label = linkageAideLinkActivityLabel(
      {
        type: 'linkage-autopilot',
        at: new Date().toISOString(),
        payload: { action: 'start', channel: 'background' },
      },
      t,
    )
    expect(label).toContain('策略')
    expect(label).toContain('后台')
  })

  it('labels linkage-graph-changed', () => {
    const label = linkageAideLinkActivityLabel(
      {
        type: 'linkage-graph-changed',
        at: new Date().toISOString(),
        payload: { nodes: 5, openTasks: 2 },
      },
      t,
    )
    expect(label).toContain('关系网')
    expect(label).toContain('5')
  })
})
