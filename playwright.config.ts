import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  // 45s : le premier hit sur une route lourde (ex. /demandes) déclenche la
  // compilation à froid du chunk Nuxt dev (dashboard + modal négociation),
  // qui peut dépasser les 30s par défaut sur un runner CI peu véloce.
  timeout: 45_000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
