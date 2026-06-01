import { expect, test } from '@playwright/test'
import {
  createCollabRoomAsHost,
  expectCollabStatusBarSession,
  joinCollabRoomAsViewer,
  registerAndLogin,
  uniqueCollabUser,
} from './collab-helpers'

/**
 * Dual-browser collaboration smoke (v1.1.3 F4, hardened v1.1.3.8).
 *
 * Requires: npm run dev:stack:collab (or Playwright `collab` project webServer)
 *           Postgres + CollaborationRoom migration applied.
 *
 * Run: npm run test:e2e:collab
 */
test.describe('Collaboration M1 smoke (2 browsers)', () => {
  test('host creates room; viewer joins read-only', async ({ browser }) => {
    test.setTimeout(240_000)

    const hostUser = uniqueCollabUser('collab-host')
    const viewerUser = uniqueCollabUser('collab-viewer')

    const hostContext = await browser.newContext()
    const viewerContext = await browser.newContext()
    const hostPage = await hostContext.newPage()
    const viewerPage = await viewerContext.newPage()

    try {
      await registerAndLogin(hostPage, hostUser)
      const roomCode = await createCollabRoomAsHost(hostPage)

      await registerAndLogin(viewerPage, viewerUser)
      await joinCollabRoomAsViewer(viewerPage, roomCode)

      await expect(viewerPage.locator('.collab-readonly-banner')).toBeVisible({ timeout: 15_000 })
      await expect(hostPage.locator('.collab-readonly-banner')).toHaveCount(0)

      await expectCollabStatusBarSession(viewerPage, { role: /只读|Viewer/i })
      await expectCollabStatusBarSession(hostPage, { role: /主持人|Host/i })
    } finally {
      await hostContext.close()
      await viewerContext.close()
    }
  })
})
