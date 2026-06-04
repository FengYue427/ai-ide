import { expect, test } from '@playwright/test'
import { gotoApp } from './helpers'
import {
  expectCloudWorkspaceListed,
  expectWorkspaceSavedFlash,
  registerLoginAndOpenWorkspace,
  saveCurrentWorkspace,
  uniqueStackUser,
  waitForApiReady,
} from './fullstack-helpers'

/**
 * Requires dev:stack (Vite :3000 + API :3001) and Postgres (see npm run db:setup).
 * Run: npm run test:e2e:stack
 */
test.describe('Full stack (API + UI)', () => {
  test.describe.configure({ mode: 'serial' })

  test('API session responds when stack is up', async ({ page }) => {
    await gotoApp(page)
    await waitForApiReady(page)
    const origin = new URL(page.url()).origin
    const session = await page.request.get(`${origin}/api/auth/session`)
    expect(session.status()).toBeGreaterThanOrEqual(200)
    expect(session.status()).toBeLessThan(500)
  })

  test('registers and saves a cloud workspace', async ({ page }) => {
    const user = uniqueStackUser('stack-save')
    const workspaceName = `e2e-ws-${Date.now().toString(36)}`

    await registerLoginAndOpenWorkspace(page, user)
    await saveCurrentWorkspace(page, workspaceName)
    await expectWorkspaceSavedFlash(page)
    await expectCloudWorkspaceListed(page, workspaceName)
  })
})
