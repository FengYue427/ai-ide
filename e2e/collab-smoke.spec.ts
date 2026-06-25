import { expect, test } from '@playwright/test'
import {
  createCollabRoomAsHost,
  expectCollabStatusBarSession,
  joinCollabRoomAsViewer,
  registerAndLogin,
  uniqueCollabUser,
  upgradeUserToProForE2E,
} from './collab-helpers'

/**
 * Dual-browser collaboration smoke (v1.1.3 F4, hardened v1.1.3.8).
 *
 * Requires: Playwright `collab` project (API :3001 + preview/dev :3000)
 *           Postgres + CollaborationRoom migration applied.
 *
 * Run: npm run test:e2e:collab
 */
test.describe('Collaboration M1 smoke (2 browsers)', () => {
  test.describe.configure({ mode: 'serial' })

  test('host creates room; viewer joins read-only', async ({ browser }) => {
    test.setTimeout(180_000)

    const hostUser = uniqueCollabUser('collab-host')
    const viewerUser = uniqueCollabUser('collab-viewer')

    const hostContext = await browser.newContext()
    const viewerContext = await browser.newContext()
    const hostPage = await hostContext.newPage()
    const viewerPage = await viewerContext.newPage()

    try {
      await registerAndLogin(hostPage, hostUser)
      await upgradeUserToProForE2E(hostPage)
      const roomCode = await createCollabRoomAsHost(hostPage)
      await expectCollabStatusBarSession(hostPage, { role: /主持人|Host/i })

      await registerAndLogin(viewerPage, viewerUser)
      await joinCollabRoomAsViewer(viewerPage, roomCode)

      await expect(viewerPage.locator('.collab-readonly-banner')).toBeVisible({ timeout: 30_000 })
      await expect(hostPage.locator('.collab-readonly-banner')).toHaveCount(0)

      await expectCollabStatusBarSession(viewerPage, { role: /只读|Viewer/i })
    } finally {
      await hostContext.close()
      await viewerContext.close()
    }
  })
})
