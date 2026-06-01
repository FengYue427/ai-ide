import { expect, test } from '@playwright/test'
import { gotoApp } from './helpers'

test.describe('AI IDE shell', () => {
  test('loads toolbar and default editor tab', async ({ page }) => {
    await gotoApp(page)
    await expect(page.getByRole('button', { name: /运行/ })).toBeVisible()
    await expect(page.locator('.tab.active .tab-label')).toHaveText('index.js')
  })

  test('opens command palette from toolbar', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: /命令面板|Command palette/i }).click()
    await expect(page.getByPlaceholder(/命令|文件名|@/)).toBeVisible({ timeout: 10_000 })
  })
})
