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
}

export async function waitForMonacoHarness(page: Page): Promise<void> {
  await page.waitForFunction(
    () => !!(window as MonacoHarnessWindow).__AI_IDE_MONACO__,
    undefined,
    { timeout: 30_000 },
  )
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
}

export async function monacoGoToReferencesAt(
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
    void editor.getAction('editor.action.goToReferences')?.run()
  }, position)
  await page.waitForTimeout(600)
}

export async function monacoGoToDefinitionAt(
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
    void editor.getAction('editor.action.revealDefinition')?.run()
  }, position)
  await page.waitForTimeout(500)
}

export async function expectActiveTabLabel(page: Page, label: string): Promise<void> {
  await expect(page.locator('.tab.active .tab-label')).toHaveText(label, { timeout: 15_000 })
}
