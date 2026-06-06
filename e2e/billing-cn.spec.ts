/**
 * E2E: v1.5.6 CN billing UI — Alipay pricing from plans.ts
 */
import { expect, test } from '@playwright/test'
import { gotoApp } from './helpers'

test.describe('CN billing UI (v1.5.6)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        if (url.includes('/api/subscription/payment-methods')) {
          return new Response(
            JSON.stringify({
              alipay: true,
              wechat: false,
              stripe: false,
              devMock: false,
              publicWelfare: false,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes('/api/subscription/plans')) {
          return new Response(
            JSON.stringify({
              plans: [
                {
                  id: 'pro',
                  name: 'pro',
                  displayName: '专业版',
                  description: '¥39/月',
                  price: 39,
                  currency: 'CNY',
                  features: ['平台 AI'],
                  limits: { aiRequestsPerDay: 2000, workspaces: -1, storageGB: 30 },
                },
                {
                  id: 'enterprise',
                  name: 'enterprise',
                  displayName: '团队版',
                  description: '¥79/月',
                  price: 79,
                  currency: 'CNY',
                  features: ['不限配额'],
                  limits: { aiRequestsPerDay: -1, workspaces: -1, storageGB: 100 },
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return originalFetch(input, init)
      }
    })
  })

  test('subscription modal shows CN prices when Alipay is enabled', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: '查看套餐' }).click()
    await expect(page.getByText('订阅计划')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('¥39').first()).toBeVisible()
    await expect(page.getByText('¥79').first()).toBeVisible()
    await expect(page.getByText(/支付宝|Alipay/i).first()).toBeVisible()
  })
})
