import { expect, test } from '@playwright/test'
import { prepareE2EStorage, waitForShellReady } from './helpers'

test.describe('Multi-root workspace (v1.2.3 F2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:multiRoot', '1')
    })
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('adds second root and keeps file trees isolated', async ({ page }) => {
    const switcher = page.getByTestId('workspace-root-switcher')
    await expect(switcher).toBeVisible({ timeout: 10_000 })

    await switcher.getByRole('button', { name: /添加工作区根|Add workspace root/i }).click()

    const select = page.locator('#workspace-root-select')
    await expect(select.locator('option')).toHaveCount(2, { timeout: 5_000 })

    const root1Label = await select.locator('option').nth(1).textContent()
    await select.selectOption({ index: 1 })

    await page.getByRole('button', { name: /新建|Create/i }).first().click()
    const filenameInput = page.locator('.sidebar-input')
    await expect(filenameInput).toBeVisible({ timeout: 5_000 })
    await filenameInput.fill('root-only.ts')
    await page.getByRole('button', { name: /创建|Create/i }).click()

    await expect(page.locator('.sidebar-file-name', { hasText: 'root-only.ts' })).toBeVisible({
      timeout: 8_000,
    })

    await select.selectOption({ index: 0 })
    await expect(page.locator('.sidebar-file-name', { hasText: 'root-only.ts' })).toHaveCount(0, {
      timeout: 5_000,
    })
    await expect(page.locator('.sidebar-file-name', { hasText: 'index.js' }).first()).toBeVisible()

    await select.selectOption({ index: 1 })
    await expect(page.locator('.sidebar-file-name', { hasText: 'root-only.ts' })).toBeVisible()
    expect(root1Label).toBeTruthy()
  })

  test('removes extra root and returns to single root', async ({ page }) => {
    const switcher = page.getByTestId('workspace-root-switcher')
    await switcher.getByRole('button', { name: /添加工作区根|Add workspace root/i }).click()
    const select = page.locator('#workspace-root-select')
    await expect(select.locator('option')).toHaveCount(2)

    await switcher.getByRole('button', { name: /移除当前根|Remove current root/i }).click()
    await expect(select.locator('option')).toHaveCount(1, { timeout: 5_000 })
  })
})
