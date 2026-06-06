import { test, expect } from '@playwright/test'
import { gotoApp } from './helpers'

test.describe('billing skeleton (no real payment)', () => {
  test('subscription modal shows plans for guests in beta', async ({ page }) => {
    await gotoApp(page)

    await page.getByRole('button', { name: '查看套餐' }).click()
    await expect(page.getByText('订阅计划')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('专业版').first()).toBeVisible()
    await expect(page.getByText('$9.99').first()).toBeVisible()
    await expect(page.getByText('$19.99').first()).toBeVisible()
    await expect(page.getByText(/经济模型|economy models/i).first()).toBeVisible()
    // Beta note, or live Stripe/CN pricing once billing Path B is enabled.
    await expect(page.getByText(/(公测期|支持.*\$9\.99|Stripe)/)).toBeVisible()
  })
})
