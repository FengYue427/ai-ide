/**
 * E2E: v1.5 Tab++ production (F1/F2)
 */
import { expect, test } from '@playwright/test'
import {
  openSettingsTab,
  prepareE2EStorage,
  prepareLoggedInUser,
  waitForShellReady,
} from './helpers'

test.describe('v1.5 Tab++ production', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:tabPlusPlus', '1')
    })
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('tab completion card shows Tab++ production badge when flag is on', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const badge = page.getByTestId('settings-tab-plus-plus-production')
    await expect(badge).toBeVisible({ timeout: 10_000 })
    await expect(badge).toHaveText(/Tab\+\+.*生产|Tab\+\+ production/i)
    const metrics = page.getByTestId('settings-tab-completion')
    await expect(
      metrics.getByText(/P95 < 400|P95 < 400 ms · debounce 250/i),
    ).toBeVisible()
  })
})
