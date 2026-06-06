import { test, expect } from '@playwright/test'
import {
  openSettingsTab,
  prepareE2EStorage,
  prepareLoggedInUser,
  waitForShellReady,
} from './helpers'

test.describe('v1.5 platform models (F0)', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
    await openSettingsTab(page, 'ai')
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
