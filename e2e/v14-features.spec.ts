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
    const rows = card.getByRole('listitem')
    await expect(rows.filter({ hasText: /Tab\/FIM.*生产|Tab\/FIM production/i })).toBeVisible()
    await expect(rows.filter({ hasText: /索引 2k|Index 2k/i })).toBeVisible()
    await expect(rows.filter({ hasText: /Git.*stage|Git 块级/i })).toBeVisible()
  })

  test('tab completion metrics card shows P95 line', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const metrics = page.getByTestId('settings-tab-completion')
    await expect(metrics).toBeVisible()
    await expect(metrics.getByText(/P95|P50|延迟分位|Latency percentiles/i)).toBeVisible()
  })

  test('tab completion card shows Tab++ POC badge when session flag is on', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:tabPlusPlusPoc', '1')
    })
    await page.goto('/')
    await waitForShellReady(page)
    await openSettingsTab(page, 'features')
    const badge = page.getByTestId('settings-tab-plus-plus-poc')
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText(/Tab\+\+ POC|multiline ghost/i)
  })

  test('tab completion card shows Tab++ POC P95 and debounce targets when flag is on', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:tabPlusPlusPoc', '1')
    })
    await page.goto('/')
    await waitForShellReady(page)
    await openSettingsTab(page, 'features')
    const metrics = page.getByTestId('settings-tab-completion')
    await expect(
      metrics.getByText(/Tab\+\+ POC 目标：P95 < 400 ms · debounce 280 ms|Tab\+\+ POC targets: P95 < 400 ms · debounce 280 ms/i),
    ).toBeVisible()
  })
})
