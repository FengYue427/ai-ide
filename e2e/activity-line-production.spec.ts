/**
 * E2E: Activity Line production path (v1.8) — no legacy localStorage stub required
 */
import { expect, test } from '@playwright/test'
import {
  gotoApp,
  openChatPanelFromActivityBar,
  openSettingsTab,
  prepareLoggedInUser,
} from './helpers'

test.describe('Activity Line production', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await gotoApp(page)
  })

  test('features tab shows runtime card with production badges', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const card = page.getByTestId('settings-aide-runtime-card')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card).toContainText(/F4|F5|Runtime|Activity/i)
  })

  test('chat panel shows activity line without legacy stub flag', async ({ page }) => {
    await openChatPanelFromActivityBar(page)
    await expect(page.getByTestId('aide-activity-line')).toBeVisible({ timeout: 10_000 })
  })
})
