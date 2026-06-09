import { expect, test } from '@playwright/test'
import { gotoApp, prepareGuestUser } from './helpers'

test.describe('Auth & quota UI', () => {
  test('opens login modal from toolbar', async ({ page }) => {
    await gotoApp(page)

    await page.getByRole('button', { name: '登录' }).click()
    await expect(page.getByText('登录以同步您的工作区数据')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.auth-modal')).toBeVisible()
  })

  test('shows guest daily quota in AI chat panel', async ({ page }) => {
    await prepareGuestUser(page)
    await gotoApp(page)
    await page.getByRole('button', { name: /AI 助手|AI assistant/i }).click()

    const quota = page.locator('.quota-indicator')
    await expect(quota).toBeVisible({ timeout: 15_000 })
    await expect(quota).toContainText(/今日.*用量|AI usage today|Today/i)
    await expect(quota).toContainText(/\d+\/\d+/)
    await expect(quota).toContainText(/200|加权|weighted/i)
  })
})
