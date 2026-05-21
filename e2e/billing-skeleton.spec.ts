import { test, expect } from '@playwright/test'
import { gotoApp, prepareLoggedInUser } from './helpers'

test.describe('billing skeleton (no real payment)', () => {
  test('subscription modal shows upgrade CTA', async ({ page }) => {
    await prepareLoggedInUser(page)
    await gotoApp(page)

    await page.getByRole('button', { name: /升级套餐/ }).click()
    await expect(page.getByText('订阅计划')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('专业版').first()).toBeVisible()
    await expect(page.getByText('¥19').first()).toBeVisible()
  })
})
