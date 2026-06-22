/**
 * E2E: Intent OS Tier SL — demo queue, graph fallback, grounding block
 */
import { expect, test } from '@playwright/test'
import {
  openChatPanelFromActivityBar,
  openSettingsTab,
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
    content: '- [ ] Implement greet in src/demo.ts\n',
    language: 'markdown',
  },
  {
    name: '.aide/specs/intent-demo/acceptance.md',
    content: '- [ ] greet returns a string containing Hello\n',
    language: 'markdown',
  },
  {
    name: '.aide/specs/intent-demo/requirements.md',
    content: '# Requirements\n\nDemo greet task.\n',
    language: 'markdown',
  },
  {
    name: '.aide/specs/intent-demo/design.md',
    content: '# Design\n\nSingle function export.\n',
    language: 'markdown',
  },
]

test.describe('Intent OS Tier SL', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await page.addInitScript(() => {
      localStorage.setItem('ai-ide:feature:aideRuntimeUi', '1')
    })
  })

  test('intent graph shows spec nodes without plan links', async ({ page }) => {
    await prepareE2EStorage(page, INTENT_DEMO_FILES)
    await page.goto('/')
    await waitForShellReady(page)

    await openSettingsTab(page, 'features')
    const graph = page.getByTestId('intent-graph-panel')
    await expect(graph).toBeVisible({ timeout: 10_000 })
    await expect(graph.locator('.intent-graph-node')).not.toHaveCount(0)
  })

  test('grounding block appears in activity line and queue banner', async ({ page }) => {
    await prepareE2EStorage(page, INTENT_DEMO_FILES)
    await page.goto('/')
    await waitForShellReady(page)
    await openChatPanelFromActivityBar(page)

    await page.evaluate(() => {
      const bus = (window as Window & { __AIDE_RUNTIME_EVENT_BUS__?: { publish: (e: unknown) => void } })
        .__AIDE_RUNTIME_EVENT_BUS__
      bus?.publish({
        type: 'grounding.block',
        at: new Date().toISOString(),
        message: 'referenced path not in workspace: src/missing.ts',
        meta: { tasksPath: '.aide/specs/intent-demo/tasks.md', spec: 'intent-demo' },
      })
      const store = (window as Window & { __AIDE_IDE_STORE__?: { setState: (p: unknown) => void } })
        .__AIDE_IDE_STORE__
      store?.setState({
        lastGroundingBlock: {
          reason: 'referenced path not in workspace: src/missing.ts',
          taskPath: '.aide/specs/intent-demo/tasks.md',
          taskText: 'Implement missing feature',
        },
      })
    })

    await page.getByTestId('aide-activity-line-toggle').click()
    await expect(page.getByTestId('aide-activity-event-grounding.block')).toBeVisible({ timeout: 10_000 })

    const banner = page.getByTestId('grounding-block-banner')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText(/src\/missing\.ts/)
  })

  test('verify stage shown when verifyingSpecBackfill is set', async ({ page }) => {
    await prepareE2EStorage(page, INTENT_DEMO_FILES)
    await page.goto('/')
    await waitForShellReady(page)
    await openChatPanelFromActivityBar(page)

    await page.evaluate(() => {
      const store = (window as Window & { __AIDE_IDE_STORE__?: { setState: (p: unknown) => void } })
        .__AIDE_IDE_STORE__
      store?.setState({
        verifyingSpecBackfill: {
          taskPath: '.aide/specs/intent-demo/tasks.md',
          taskText: 'Implement greet in src/demo.ts',
          specAcceptancePath: '.aide/specs/intent-demo/acceptance.md',
        },
      })
    })

    await expect(page.getByTestId('intent-queue-stage-verify')).toBeVisible({ timeout: 10_000 })
  })
})
