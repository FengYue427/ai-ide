import { expect, test } from '@playwright/test'
import { filterCommandPalette } from './command-helpers'
import { E2E_DEFAULT_FILES, gotoApp, waitForShellReady } from './helpers'

const SHARE_SLUG = 'e2ecloud1'
const SHARED_FILE = {
  name: 'shared.ts',
  content: 'export const sharedValue = 42\n',
  language: 'typescript',
}

function mockShareApi(page: import('@playwright/test').Page) {
  return Promise.all([
    page.route('**/api/shares', async (route) => {
      const method = route.request().method()
      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            share: { slug: SHARE_SLUG, createdAt: new Date().toISOString() },
          }),
        })
        return
      }
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            shares: [{ slug: SHARE_SLUG, fileCount: 1, createdAt: new Date().toISOString() }],
          }),
        })
        return
      }
      await route.continue()
    }),
    page.route(`**/api/shares/${SHARE_SLUG}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            share: {
              slug: SHARE_SLUG,
              files: [SHARED_FILE],
              createdAt: new Date().toISOString(),
            },
          }),
        })
        return
      }
      await route.continue()
    }),
  ])
}

async function openShareModal(page: import('@playwright/test').Page) {
  const input = await filterCommandPalette(page, '分享')
  await page.getByRole('button', { name: /分享项目|Share project/i }).click()
  await expect(page.locator('.modal--share')).toBeVisible({ timeout: 10_000 })
}

test.describe('cloud project share', () => {
  test('creates cloud link and shows cloud hint', async ({ page }) => {
    await mockShareApi(page)
    await gotoApp(page)
    await openShareModal(page)

    await page.getByTestId('share-generate-btn').click()
    await expect(page.getByTestId('share-cloud-hint')).toBeVisible({ timeout: 10_000 })

    const link = await page.getByTestId('share-link-input').inputValue()
    expect(link).toContain(`share=${SHARE_SLUG}`)
  })

  test('restores workspace from ?share= slug via API', async ({ page }) => {
    await mockShareApi(page)
    await gotoApp(page, `/?share=${SHARE_SLUG}`)
    await waitForShellReady(page)
    await expect(page.locator('.tab.active .tab-label')).toHaveText('shared.ts', { timeout: 15_000 })
  })

  test('history tab lists cloud share entry', async ({ page }) => {
    await mockShareApi(page)
    await gotoApp(page)
    await openShareModal(page)
    await page.getByTestId('share-generate-btn').click()
    await expect(page.getByTestId('share-cloud-hint')).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: /历史记录|History/i }).click()
    await expect(page.getByTestId('share-history-item')).toHaveCount(1, { timeout: 10_000 })
    await expect(page.getByTestId('share-history-item')).toContainText(/云端|Cloud/)
  })
})
