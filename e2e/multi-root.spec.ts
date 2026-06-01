import { expect, test } from '@playwright/test'
import { gotoApp, prepareE2EStorage } from './helpers'

test.describe('Multi-root workspace (v1.2 F1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:multiRoot', '1')
    })
    await prepareE2EStorage(page)
    await page.goto('/')
    await expect(page.locator('.toolbar-title')).toHaveText('AI IDE', { timeout: 30_000 })
    await expect(page.locator('.welcome-screen')).toHaveCount(0, { timeout: 15_000 })
  })

  test('adds second root and switches without mixing files', async ({ page }) => {
    const switcher = page.getByTestId('workspace-root-switcher')
    await expect(switcher).toBeVisible({ timeout: 10_000 })

    await switcher.getByRole('button', { name: /添加工作区根|Add workspace root/i }).click()

    const select = page.locator('#workspace-root-select')
    await expect(select.locator('option')).toHaveCount(2, { timeout: 5_000 })

    await expect(page.locator('.tab.active .tab-label')).toHaveText('index.js')

    await select.selectOption({ index: 0 })
    await expect(page.locator('.tab.active .tab-label')).toHaveText('index.js', { timeout: 5_000 })

    await select.selectOption({ index: 1 })
    await expect(page.locator('.tab.active .tab-label')).toHaveText('index.js')
  })
})
