import { defineConfig, devices } from '@playwright/test'

const PORT = 3410

export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    // The documentation runs on OTW CMS, so it has a database for its admin.
    env: { CMS_DATA_DIR: '.data/e2e', DATABASE_URL: '' },
  },
})
