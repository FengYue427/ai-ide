import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'lib/**/*.test.ts', 'scripts/**/*.test.mjs'],
    coverage: {
      reporter: ['text', 'html'],
      thresholds: {
        lines: 20,
        functions: 20,
        branches: 15,
        statements: 20,
      },
    },
  },
})
