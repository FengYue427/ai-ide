import { expect, test } from '@playwright/test'
import { E2E_DEFAULT_FILES, prepareDesktopCrossOriginShell, prepareE2EStorage } from './helpers'

test.describe('desktop billing return (mocked shell)', () => {
  test('subscription success with desktop_shell reloads local shell', async ({ page }) => {
    await prepareE2EStorage(page, E2E_DEFAULT_FILES)
    await prepareDesktopCrossOriginShell(page)

    await page.route('**/api/subscription', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            subscription: { plan: 'pro', status: 'active', userId: 'e2e' },
          }),
        })
        return
      }
      await route.continue()
    })

    await page.goto('/?subscription=success&plan=pro&desktop_shell=1')

    await expect
      .poll(async () => page.evaluate(() => (window as Window & { __desktopReloadCalled?: boolean }).__desktopReloadCalled))
      .toBe(true)
  })

  test('checkout payload includes desktopShell when desktop shell mocked', async ({ page }) => {
    await prepareE2EStorage(page, E2E_DEFAULT_FILES)
    await prepareDesktopCrossOriginShell(page)

    let checkoutBody: Record<string, unknown> | null = null
    await page.route('**/api/subscription/checkout', async (route) => {
      checkoutBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ mode: 'dev_mock', plan: 'pro' }),
      })
    })

    await page.route('**/api/subscription/payment-methods', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ devMock: true, publicWelfare: false }),
      })
    })

    await page.route('**/api/subscription/plans', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plans: [
            {
              id: 'pro',
              name: 'pro',
              displayName: '专业版',
              price: 9.99,
              currency: 'USD',
              features: [],
              limits: { aiRequestsPerDay: 1000, workspaces: 5, storageGB: 5 },
            },
          ],
        }),
      })
    })

    await page.goto('/')
    await page.getByRole('button', { name: '查看套餐' }).click()
    await expect(page.getByText('订阅计划')).toBeVisible({ timeout: 15_000 })

    const proButton = page.getByRole('button', { name: /升级|Upgrade|Subscribe/i }).first()
    if (await proButton.isVisible().catch(() => false)) {
      await proButton.click()
      await expect.poll(() => checkoutBody?.desktopShell).toBe(true)
    }
  })
})
