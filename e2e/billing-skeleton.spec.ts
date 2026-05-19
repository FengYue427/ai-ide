import { test, expect } from '@playwright/test'

test.describe('billing skeleton (no real payment)', () => {
  test('subscription modal shows upgrade CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AI IDE')).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: '升级 Pro' }).click()
    await expect(page.getByText('订阅计划')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('专业版').first()).toBeVisible()
    await expect(page.getByText('¥19').first()).toBeVisible()
  })
})
