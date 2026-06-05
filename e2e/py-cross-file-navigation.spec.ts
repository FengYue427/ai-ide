/**
 * E2E: Python cross-file go-to-definition (v1.3 F1)
 */
import { expect, test } from '@playwright/test'
import { E2E_NAV_PYTHON_FILES, prepareE2EStorage, waitForShellReady } from './helpers'
import {
  expectActiveTabLabel,
  monacoGoToDefinitionAt,
  waitForTsProjectSync,
} from './monaco-helpers'

test.describe('Cross-file Python navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:pythonNav', '1')
    })
    await prepareE2EStorage(page, E2E_NAV_PYTHON_FILES)
    await page.goto('/')
    await waitForShellReady(page)
    await expectActiveTabLabel(page, 'main.py')
    await waitForTsProjectSync(page)
  })

  test('F12 on import opens lib/util.py', async ({ page }) => {
    await monacoGoToDefinitionAt(page, { lineNumber: 1, column: 22 })
    await expectActiveTabLabel(page, 'lib/util.py')
  })
})
