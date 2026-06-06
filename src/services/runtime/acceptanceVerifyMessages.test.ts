import { describe, expect, it } from 'vitest'
import { formatAcceptanceVerifyFailures } from './acceptanceVerifyMessages'

describe('acceptanceVerifyMessages', () => {
  it('formats unchecked items and failed commands', () => {
    const detail = formatAcceptanceVerifyFailures({
      ok: false,
      uncheckedItems: ['登录页可访问', '单元测试通过'],
      commandResults: [{ command: 'npm test', status: 'fail', detail: 'exit 1' }],
      failures: ['unchecked: 登录页可访问', 'command failed: npm test'],
    })

    expect(detail).toContain('未完成验收项（2）')
    expect(detail).toContain('登录页可访问')
    expect(detail).toContain('npm test')
  })
})
