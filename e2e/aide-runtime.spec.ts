import { test, expect } from '@playwright/test'
import {
  openSettingsTab,
  prepareE2EStorage,
  prepareLoggedInUser,
  waitForShellReady,
} from './helpers'

test.describe('v1.5 aide runtime F4/F6', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.evaluate(() => {
      localStorage.setItem('ai-ide:feature:aideRuntimeUi', '1')
      localStorage.setItem('ai-ide:feature:aideRuntime', '1')
    })
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('shows runtime production card in settings', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const card = page.getByTestId('settings-aide-runtime-stub')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card.getByText('F4')).toBeVisible()
  })
})
