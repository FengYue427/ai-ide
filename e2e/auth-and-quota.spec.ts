import { expect, test } from '@playwright/test'

test.describe('Auth & quota UI', () => {
  test('opens login modal from toolbar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AI IDE')).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: '登录' }).click()
    await expect(page.getByText('登录以同步您的工作区数据')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.auth-modal')).toBeVisible()
  })

  test('shows guest daily quota in AI chat panel', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'AI', exact: true }).click()

    await expect(page.getByText('今日用量')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/\d+\/50/)).toBeVisible()
  })
})
