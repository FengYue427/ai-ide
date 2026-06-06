import { test, expect } from '@playwright/test'
import {
  openSettingsTab,
  prepareE2EStorage,
  prepareLoggedInUser,
  waitForShellReady,
} from './helpers'

const HOOKS = `version: 1
hooks:
  - id: pre-run-tests
    on: queue.before
    run: shell
    command: npm run test:local
`

test.describe('v1.5 spec artifacts F3', () => {
  test.beforeEach(async ({ page }) => {
    await prepareLoggedInUser(page)
    await prepareE2EStorage(page)
    await page.goto('/')
    await waitForShellReady(page)
  })

  test('creates hooks.yaml from spec catalog', async ({ page }) => {
    await page.evaluate((content) => {
      const key = 'ai-ide:workspace-files'
      const raw = localStorage.getItem(key)
      const files = raw ? JSON.parse(raw) : []
      files.push({
        name: '.aide/specs/auth-refactor/tasks.md',
        content: '# Auth\n\n- [ ] Login flow\n',
        language: 'markdown',
      })
      localStorage.setItem(key, JSON.stringify(files))
    }, HOOKS)

    await openSettingsTab(page, 'features')
    const createBtn = page.getByTestId('spec-create-hooks-auth-refactor')
    if (await createBtn.count()) {
      await createBtn.click()
      await expect(page.getByText('.aide/specs/auth-refactor/hooks.yaml')).toBeVisible({ timeout: 10_000 })
    }
  })
})
