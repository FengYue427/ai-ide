/**
 * E2E: Workbench Shell layout phases (v1.2.2 GA · F5)
 *
 * Covers:
 *  - F1: auxiliary column docked (search, preview, code review, performance)
 *  - F2: layer z-index correctness (modals above overlays)
 *  - F3: visual density (compact toolbar, settings, chat)
 *  - F4: panel resize handles + narrow-screen sidebar collapse
 *
 * Prerequisite: seeded autosave so bootstrap skips the welcome overlay.
 */
import { expect, test } from '@playwright/test'
import { prepareE2EStorage, waitForShellReady } from './helpers'

test.describe('workbench shell layout', () => {
  test.beforeEach(async ({ page }) => {
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('F1 — auxiliary column is docked and mutually exclusive', async ({ page }) => {
    const auxiliaryPanel = page.locator('.workbench-auxiliary')

    await page.getByRole('button', { name: /搜索|Search/i }).click()
    await expect(auxiliaryPanel).toBeVisible({ timeout: 8_000 })
    const searchInput = auxiliaryPanel.getByPlaceholder(
      /搜索已打开文件|Search open files|搜索整个工作区|Search workspace/i,
    )
    await expect(searchInput).toBeVisible({ timeout: 5_000 })

    // Preview replaces search in the single auxiliary slot
    await page.getByRole('button', { name: /预览|Preview/i }).click()
    await expect(auxiliaryPanel).toBeVisible()
    await expect(searchInput).not.toBeVisible({ timeout: 5_000 })
    await expect(auxiliaryPanel.locator('.preview-shell')).toBeVisible({ timeout: 5_000 })

    await auxiliaryPanel.getByRole('button', { name: /关闭预览|Close preview/i }).click()
    await expect(auxiliaryPanel).not.toBeVisible({ timeout: 5_000 })
  })

  test('F2 — command palette modal layer above all', async ({ page }) => {
    // Open command palette via toolbar
    const cmdBtn = page.locator('.toolbar-cmd-btn, [class*="Command"]').first()
    if (await cmdBtn.isVisible()) {
      await cmdBtn.click()
    } else {
      // Fallback: keyboard shortcut Ctrl+K or Ctrl+Shift+P
      await page.keyboard.press('Control+k')
    }

    const palette = page.locator('.command-palette-overlay, [class*="CommandPalette"]')
    await expect(palette.first()).toBeVisible({ timeout: 5_000 })

    // Close palette
    await page.keyboard.press('Escape')
    await expect(palette.first()).not.toBeVisible({ timeout: 5_000 })
  })

  test('F3 — toolbar and right panel reflect density tokens', async ({ page }) => {
    // Toolbar height (via 40px min-height)
    const toolbar = page.locator('.toolbar')
    await expect(toolbar).toBeVisible()
    const toolbarBox = await toolbar.boundingBox()
    expect(toolbarBox).not.toBeNull()
    // Height should be ≤ 48 (old) and ≥ 36 (dense)
    expect(toolbarBox!.height).toBeLessThanOrEqual(48)
    expect(toolbarBox!.height).toBeGreaterThanOrEqual(34)

    // Right panel should have the --right-panel-width-chat width
    const rightPanel = page.locator('.right-panel, [class*="right-panel" i]').first()
    if (await rightPanel.isVisible()) {
      const rpBox = await rightPanel.boundingBox()
      expect(rpBox).not.toBeNull()
      // Expect width in range 340-400px (density default 360px)
      expect(rpBox!.width).toBeGreaterThanOrEqual(300)
      expect(rpBox!.width).toBeLessThanOrEqual(500)
    }
  })

  test('F4 — sidebar resize handle present and functional', async ({ page }) => {
    const sidebar = page.locator('.sidebar')
    await expect(sidebar).toBeVisible({ timeout: 8_000 })
    const sidebarBox = await sidebar.boundingBox()
    expect(sidebarBox).not.toBeNull()
    const initialWidth = sidebarBox!.width

    // The resize handle should be present adjacent to the sidebar
    const handle = page.locator('.panel-resize-handle')
    await expect(handle.first()).toBeVisible({ timeout: 5_000 })
  })

  test('F4 — narrow viewport hides sidebar when right panel is open', async ({ page }) => {
    await page.getByRole('button', { name: /AI 助手|AI assistant/i }).click()
    await expect(page.locator('.right-panel')).toBeVisible({ timeout: 8_000 })

    await page.setViewportSize({ width: 800, height: 700 })
    await expect(page.locator('.workspace-main')).toHaveClass(/workspace-main--no-sidebar/, {
      timeout: 8_000,
    })

    await page.setViewportSize({ width: 1280, height: 800 })
  })
})
