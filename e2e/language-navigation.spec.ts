/**
 * E2E: Command palette language navigation + symbol outline (v1.2.5 F1)
 */
import { expect, test } from '@playwright/test'
import { closeCommandPalette, filterCommandPalette, openCommandPalette } from './command-helpers'
import { E2E_SYMBOL_FILES, prepareE2EStorage, waitForShellReady } from './helpers'

test.describe('Language navigation smoke', () => {
  test.beforeEach(async ({ page }) => {
    await prepareE2EStorage(page, E2E_SYMBOL_FILES)
    await page.goto('/')
    await waitForShellReady(page)
    await expect(page.locator('.tab.active .tab-label')).toHaveText('sample.ts', { timeout: 10_000 })
  })

  test('command palette lists go to definition and references', async ({ page }) => {
    await filterCommandPalette(page, '定义')
    await expect(page.getByRole('button', { name: /转到定义|Go to definition/i })).toBeVisible({
      timeout: 5_000,
    })
    await closeCommandPalette(page)

    await filterCommandPalette(page, '引用')
    await expect(page.getByRole('button', { name: /转到引用|Go to references/i })).toBeVisible({
      timeout: 5_000,
    })
    await expect(page.getByText(/Shift\+F12/)).toBeVisible()
  })

  test('go to definition command dismisses palette and keeps editor', async ({ page }) => {
    await filterCommandPalette(page, '定义')
    await page.getByRole('button', { name: /转到定义|Go to definition/i }).click()
    await expect(page.locator('.command-palette-overlay')).toHaveCount(0, { timeout: 5_000 })
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15_000 })
  })

  test('sidebar outline lists symbols for active TypeScript file', async ({ page }) => {
    const outline = page.locator('.sidebar-outline')
    await expect(outline).toBeVisible({ timeout: 10_000 })
    await expect(outline.locator('.sidebar-outline-header')).toContainText(/大纲|Outline/i)

    const count = outline.locator('.sidebar-outline-count')
    await expect(count).toBeVisible()
    const countText = (await count.textContent())?.trim() ?? '0'
    expect(Number.parseInt(countText, 10)).toBeGreaterThan(0)

    await expect(outline.locator('.sidebar-outline-item').filter({ hasText: 'greet' }).first()).toBeVisible()
    await expect(outline.locator('.sidebar-outline-item').filter({ hasText: /App\.run|App/ }).first()).toBeVisible()
  })

  test('command palette opens from toolbar shortcut area', async ({ page }) => {
    await openCommandPalette(page)
    await expect(page.getByRole('button', { name: /格式化|Format document/i })).toBeVisible({
      timeout: 5_000,
    })
  })
})
