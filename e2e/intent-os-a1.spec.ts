/**
 * E2E: Intent OS Tier A — proof bundle + share intent snapshot
 */
import { expect, test } from '@playwright/test'
import {
  openChatPanelFromActivityBar,
  prepareE2EStorage,
  prepareLoggedInUser,
  type E2ESeedFile,
  waitForShellReady,
} from './helpers'

const INTENT_DEMO_FILES: E2ESeedFile[] = [
  {
    name: 'src/demo.ts',
    content: 'export function greet(): string {\n  return "Hello"\n}\n',
    language: 'typescript',
  },
  {
    name: '.aide/specs/intent-demo/tasks.md',
    content: '- [x] Implement greet in `src/demo.ts`\n',
    language: 'markdown',
  },
  {
    name: '.aide/specs/intent-demo/acceptance.md',
    content: '- [x] greet returns Hello\n',
    language: 'markdown',
  },
  {
    name: '.aide/meta/runtime-state.json',
    content: JSON.stringify({
      version: 1,
      activeSpecPath: '.aide/specs/intent-demo/tasks.md',
    }),
    language: 'json',
  },
]

test.describe('Intent OS Tier A', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:aideRuntimeUi', '1')
    })
  })

  test('queue panel shows save proof bundle button', async ({ page }) => {
    await prepareE2EStorage(page, INTENT_DEMO_FILES)
    await page.goto('/')
    await waitForShellReady(page)
    await openChatPanelFromActivityBar(page)

    await page.evaluate(() => {
      const store = (window as Window & { __AIDE_IDE_STORE__?: { setState: (p: unknown) => void } })
        .__AIDE_IDE_STORE__
      store?.setState({
        queuedSpecExecutions: [
          {
            prompt: 'run greet',
            backfill: {
              taskPath: '.aide/specs/intent-demo/tasks.md',
              taskText: 'Implement greet in `src/demo.ts`',
              specAcceptancePath: '.aide/specs/intent-demo/acceptance.md',
            },
          },
        ],
      })
    })

    const btn = page.getByTestId('queue-save-proof')
    await expect(btn).toBeVisible({ timeout: 10_000 })
    await btn.click()
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const store = (window as Window & { __AIDE_IDE_STORE__?: { getState: () => { files: { name: string }[] } } })
            .__AIDE_IDE_STORE__
          return store?.getState().files.some((f) => f.name.includes('proof-intent-demo')) ?? false
        }),
      )
      .toBe(true)
  })

  test('share modal offers intent snapshot when specs exist', async ({ page }) => {
    await prepareE2EStorage(page, INTENT_DEMO_FILES)
    await page.goto('/')
    await waitForShellReady(page)

    await page.evaluate(() => {
      const store = (window as Window & { __AIDE_IDE_STORE__?: { setState: (p: unknown) => void } })
        .__AIDE_IDE_STORE__
      store?.setState({ showShareModal: true })
    })

    await expect(page.getByTestId('share-include-intent')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('share-intent-summary')).toContainText(/intent-demo/i)
  })
})
