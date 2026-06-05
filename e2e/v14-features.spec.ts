/**
 * E2E: v1.4 settings feature cards (F1–F7 platform)
 */
import { expect, test } from '@playwright/test'
import { openSettingsTab, prepareE2EStorage, prepareLoggedInUser, waitForShellReady } from './helpers'

test.describe('v1.4 feature settings', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('features tab shows v1.4 card with production policy rows', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const card = page.getByTestId('settings-v14-features')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card.getByText(/Tab\/FIM|Tab\/FIM production/i)).toBeVisible()
    await expect(card.getByText(/索引 2k|Index 2k/i)).toBeVisible()
    await expect(card.getByText(/Git|hunk/i)).toBeVisible()
  })

  test('tab completion metrics card shows P95 line', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const metrics = page.getByTestId('settings-tab-completion')
    await expect(metrics).toBeVisible()
    await expect(metrics.getByText(/P95|P50|延迟分位|Latency percentiles/i)).toBeVisible()
  })
})
