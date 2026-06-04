/**
 * E2E: Cross-file Monaco TS go-to-definition (v1.2.7 F1)
 */
import { expect, test } from '@playwright/test'
import { filterCommandPalette } from './command-helpers'
import { E2E_NAV_FILES, prepareE2EStorage, waitForShellReady } from './helpers'
import { expectActiveTabLabel, monacoGoToDefinitionAt, monacoSetCursorAt } from './monaco-helpers'

test.describe('Cross-file TypeScript navigation', () => {
  test.beforeEach(async ({ page }) => {
    await prepareE2EStorage(page, E2E_NAV_FILES)
    await page.goto('/')
    await waitForShellReady(page)
    await expectActiveTabLabel(page, 'main.ts')
  })

  test('F12 path: go to definition on import opens lib/greet.ts', async ({ page }) => {
    await monacoGoToDefinitionAt(page, { lineNumber: 4, column: 11 })
    await expectActiveTabLabel(page, 'lib/greet.ts')
    await expect(page.locator('.monaco-editor')).toBeVisible()
  })

  test('command palette go to definition switches to definition file', async ({ page }) => {
    await monacoSetCursorAt(page, { lineNumber: 4, column: 11 })
    await filterCommandPalette(page, '定义')
    await page.getByRole('button', { name: /转到定义|Go to definition/i }).click()
    await expect(page.locator('.command-palette-overlay')).toHaveCount(0, { timeout: 5_000 })
    await expectActiveTabLabel(page, 'lib/greet.ts')
  })

  test('command palette lists go to references for cross-file project', async ({ page }) => {
    await filterCommandPalette(page, '引用')
    await expect(page.getByRole('button', { name: /转到引用|Go to references/i })).toBeVisible({
      timeout: 5_000,
    })
  })
})
