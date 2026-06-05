/**
 * E2E: v1.4.5 Spec hooks.yaml read-only preview in settings
 */
import { expect, test } from '@playwright/test'
import {
  openSettingsTab,
  prepareE2EStorage,
  prepareLoggedInUser,
  waitForShellReady,
  type E2ESeedFile,
} from './helpers'

const E2E_SPEC_HOOKS_FILES: E2ESeedFile[] = [
  {
    name: 'index.js',
    content: 'console.log("hooks e2e")',
    language: 'javascript',
  },
  {
    name: '.aide/specs/auth-refactor/tasks.md',
    content: '# Auth Refactor\n\n- [ ] Implement login\n- [ ] Add tests\n',
    language: 'markdown',
  },
  {
    name: '.aide/specs/auth-refactor/hooks.yaml',
    content: `version: 1
hooks:
  - id: pre-run-tests
    on: queue.before
    run: shell
    command: npm run test:local
  - id: on-fail
    on: verify.fail
    run: enqueue
    spec: auth-refactor
    task: fix acceptance
`,
    language: 'yaml',
  },
]

test.describe('v1.4.5 runtime hooks preview', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page, E2E_SPEC_HOOKS_FILES)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('features tab shows hooks preview for spec with hooks.yaml', async ({ page }) => {
    await openSettingsTab(page, 'features')
    const preview = page.getByTestId('spec-hooks-preview-auth-refactor')
    await expect(preview).toBeVisible({ timeout: 10_000 })
    await expect(preview.getByText(/pre-run-tests/i)).toBeVisible()
    await expect(preview.getByText(/queue\.before/i)).toBeVisible()
    await expect(preview.getByText(/verify\.fail/i)).toBeVisible()
  })
})
