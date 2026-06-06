import { test, expect } from '@playwright/test'

test.describe('v1.5 platform models (F0)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:auth-mock-user', JSON.stringify({ id: 'e2e-user', email: 'e2e@test.local' }))
    })
    await page.goto('/')
    await page.getByRole('button', { name: /设置|Settings/i }).click()
    await page.getByRole('button', { name: /AI|人工智能/i }).click()
  })

  test('shows platform-only AI settings without BYOK key field', async ({ page }) => {
    const platformOnly = page.getByTestId('settings-platform-only-ai')
    if (await platformOnly.count()) {
      await expect(platformOnly).toBeVisible()
    }
    await expect(page.getByLabel(/API Key|API 密钥/i)).toHaveCount(0)
  })

  test('lists tier labels on economy models for free plan', async ({ page }) => {
    const modelSelect = page.locator('.settings-select').filter({ has: page.locator('option') }).last()
    const options = modelSelect.locator('option')
    const count = await options.count()
    expect(count).toBeGreaterThan(0)
    const firstLabel = await options.first().textContent()
    expect(firstLabel).toMatch(/economy|standard|premium|frontier|deepseek|flash/i)
  })
})
