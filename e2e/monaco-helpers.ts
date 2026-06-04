import { expect, type Page } from '@playwright/test'

type MonacoHarnessWindow = Window & {
  __AI_IDE_MONACO__?: {
    editor: {
      getEditors: () => Array<{
        setPosition: (pos: { lineNumber: number; column: number }) => void
        focus: () => void
        getAction: (id: string) => { run: () => Promise<unknown> } | null
      }>
    }
  }
  __AI_IDE_STORE__?: {
    getState: () => {
      requestGoToDefinition: () => void
      requestGoToReferences: () => void
    }
  }
}

export async function waitForMonacoHarness(page: Page): Promise<void> {
  await page.waitForFunction(
    () => !!(window as MonacoHarnessWindow).__AI_IDE_MONACO__,
    undefined,
    { timeout: 30_000 },
  )
}

/** Editor syncs TS extra libs on a 400ms debounce — wait before semantic navigation. */
export async function waitForTsProjectSync(page: Page): Promise<void> {
  await waitForMonacoHarness(page)
  await page.waitForTimeout(900)
}

export async function monacoSetCursorAt(
  page: Page,
  position: { lineNumber: number; column: number },
): Promise<void> {
  await waitForMonacoHarness(page)
  await page.evaluate(({ lineNumber, column }) => {
    const monaco = (window as MonacoHarnessWindow).__AI_IDE_MONACO__
    const editor = monaco?.editor.getEditors()[0]
    if (!editor) throw new Error('monaco editor not mounted')
    editor.setPosition({ lineNumber, column })
    editor.focus()
  }, position)
}

export async function clickEditorTab(page: Page, label: string): Promise<void> {
  await page.locator('.tab').filter({ hasText: label }).click()
  await expectActiveTabLabel(page, label)
  await waitForTsProjectSync(page)
}

export async function monacoGoToReferencesAt(
  page: Page,
  position: { lineNumber: number; column: number },
): Promise<void> {
  await monacoSetCursorAt(page, position)
  await page.waitForTimeout(200)
  await page.evaluate(() => {
    ;(window as MonacoHarnessWindow).__AI_IDE_STORE__?.getState().requestGoToReferences()
  })
  await page.waitForTimeout(900)
}

export async function monacoGoToDefinitionAt(
  page: Page,
  position: { lineNumber: number; column: number },
): Promise<void> {
  await monacoSetCursorAt(page, position)
  await page.waitForTimeout(200)
  await page.evaluate(() => {
    ;(window as MonacoHarnessWindow).__AI_IDE_STORE__?.getState().requestGoToDefinition()
  })
  await page.waitForTimeout(900)
}

export async function expectActiveTabLabel(page: Page, label: string): Promise<void> {
  await expect(page.locator('.tab.active .tab-label')).toHaveText(label, { timeout: 15_000 })
}
