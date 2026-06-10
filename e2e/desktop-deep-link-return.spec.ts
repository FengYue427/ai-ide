import { test, expect } from '@playwright/test'
import { DESKTOP_RETURN_PENDING_KEY } from '../src/lib/desktopDeepLink'
import { E2E_DEFAULT_FILES, prepareE2EStorage } from './helpers'

test.describe('desktop deep link return prompt', () => {
  test('shows fallback banner with ai-ide deep link after browser oauth handoff', async ({ page }) => {
    await prepareE2EStorage(page, E2E_DEFAULT_FILES)
    await page.addInitScript((key) => {
      sessionStorage.setItem(key, 'oauth')
    }, DESKTOP_RETURN_PENDING_KEY)

    await page.goto('/')

    await expect(page.getByText(/打开 AI IDE 桌面版|Open AI IDE Desktop/)).toBeVisible({ timeout: 10_000 })
    const link = page.locator('a.desktop-return-prompt__btn')
    await expect(link).toHaveAttribute('href', /ai-ide:\/\/return\?kind=oauth/)
  })

  test('shows billing deep link on pending billing return', async ({ page }) => {
    await prepareE2EStorage(page, E2E_DEFAULT_FILES)
    await page.addInitScript((key) => {
      sessionStorage.setItem(key, 'billing')
    }, DESKTOP_RETURN_PENDING_KEY)

    await page.goto('/?subscription=success&plan=pro')

    await expect(page.getByText(/打开 AI IDE 桌面版|Open AI IDE Desktop/)).toBeVisible({ timeout: 10_000 })
    const link = page.locator('a.desktop-return-prompt__btn')
    await expect(link).toHaveAttribute('href', /ai-ide:\/\/return\?kind=billing&subscription=success&plan=pro/)
  })
})
