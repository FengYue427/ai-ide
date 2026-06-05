/**
 * E2E: v1.2 feature flags visibility in settings (v1.2.6 F3)
 */
import { expect, test } from '@playwright/test'
import { openSettingsTab, prepareE2EStorage, waitForShellReady } from './helpers'

test.describe('v1.2 feature status', () => {
  test.beforeEach(async ({ page }) => {
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('features tab shows v1.2 platform status card', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const card = page.getByTestId('settings-v12-features')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card).toContainText(/多根|Multi-root/i)
    await expect(card).toContainText(/虚拟|Virtual file tree/i)
  })
})
