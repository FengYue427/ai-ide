/**
 * E2E: v1.5 settings feature card (F7 platform GA)
 */
import { expect, test } from '@playwright/test'
import {
  openSettingsTab,
  prepareE2EStorage,
  prepareLoggedInUser,
  waitForShellReady,
} from './helpers'

test.describe('v1.5 feature settings', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:tabPlusPlus', '1')
      localStorage.setItem('ai-ide:feature:aideActivityLine', '1')
      localStorage.setItem('ai-ide:feature:specArtifactsV2', '1')
      localStorage.setItem('ai-ide:feature:aideRuntime', '1')
      localStorage.setItem('ai-ide:feature:aideRuntimeUi', '1')
    })
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('features tab shows v1.5 card with production rows', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const card = page.getByTestId('settings-v15-features')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card.locator('strong')).toContainText(/v1\.5/i)
    const rows = card.getByRole('listitem')
    await expect(rows.filter({ hasText: /Tab\+\+|Tab\+\+/i })).toBeVisible()
    await expect(rows.filter({ hasText: /Spec Artifacts|hooks\.yaml/i })).toBeVisible()
    await expect(rows.filter({ hasText: /AIDE Runtime|Runtime 引擎/i })).toBeVisible()
    await expect(rows.filter({ hasText: /Activity Line/i })).toBeVisible()
  })

  test('runtime stub card shows F4 badge when runtime production flag is on', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const card = page.getByTestId('settings-aide-runtime-stub')
    await expect(card).toBeVisible()
    await expect(card.getByText('F4')).toBeVisible()
    await expect(card.getByText('F5')).toBeVisible()
  })
})
