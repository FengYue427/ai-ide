/**
 * E2E: v1.3 settings feature cards (F3–F7)
 */
import { expect, test } from '@playwright/test'
import { openSettingsTab, prepareE2EStorage, prepareLoggedInUser, waitForShellReady } from './helpers'

test.describe('v1.3 feature settings', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('features tab shows v1.3, tab completion, and background agent cards', async ({ page }) => {
    await openSettingsTab(page, 'features')
    await expect(page.getByTestId('settings-v13-features')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('settings-tab-completion')).toBeVisible()
    await expect(page.getByTestId('settings-background-agent')).toBeVisible()
  })
})
