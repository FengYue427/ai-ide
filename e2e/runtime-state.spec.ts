/**
 * E2E: v1.4.7 runtime-state.json read-only preview + spec status badges
 */
import { expect, test } from '@playwright/test'
import {
  openSettingsTab,
  prepareE2EStorage,
  prepareLoggedInUser,
  waitForShellReady,
  type E2ESeedFile,
} from './helpers'

const E2E_RUNTIME_STATE_FILES: E2ESeedFile[] = [
  {
    name: 'index.js',
    content: 'console.log("runtime state e2e")',
    language: 'javascript',
  },
  {
    name: '.aide/specs/auth-refactor/tasks.md',
    content: '# Auth Refactor\n\n- [ ] Implement login\n- [ ] Add tests\n',
    language: 'markdown',
  },
  {
    name: '.aide/meta/runtime-state.json',
    content: JSON.stringify({
      version: 1,
      activeSpecPath: '.aide/specs/auth-refactor/tasks.md',
      queueSnapshot: { specPending: 2, planPending: 0 },
      lastHookResults: [
        { hookId: 'pre-run-tests', at: '2026-06-05T10:00:00Z', status: 'ok' },
      ],
      updatedAt: '2026-06-05T10:00:05Z',
    }),
    language: 'json',
  },
]

test.describe('v1.4.7 runtime state preview', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page, E2E_RUNTIME_STATE_FILES)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('features tab shows runtime-state summary and active spec badge', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const summary = page.getByTestId('spec-runtime-state-summary')
    await expect(summary).toBeVisible({ timeout: 10_000 })
    await expect(summary.getByText(/active: auth-refactor/i)).toBeVisible()
    await expect(summary.getByText(/spec 2/i)).toBeVisible()
    await expect(summary.getByText(/pre-run-tests/i)).toBeVisible()

    const badge = page.getByTestId('spec-status-badge-auth-refactor')
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText(/活跃|Active/i)
  })
})
