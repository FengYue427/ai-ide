import { expect, test } from '@playwright/test'

test.describe('AI IDE shell', () => {
  test('loads toolbar and default editor tab', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AI IDE')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: /运行/ })).toBeVisible()
    await expect(page.getByText('index.js')).toBeVisible()
  })

  test('opens command palette from toolbar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /命令面板/ }).click()
    await expect(page.getByPlaceholder(/命令|文件名|@/)).toBeVisible({ timeout: 10_000 })
  })
})
