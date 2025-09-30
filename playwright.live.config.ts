import { defineConfig, devices } from '@playwright/test';

// Live/dev server config: requires PW_BASE_URL and does NOT start a local web server
// Usage:
//   PW_BASE_URL="https://dev.example.com" E2E_EMAIL="..." E2E_PASSWORD="..." \
//   npx playwright test --config=playwright.live.config.ts --project=chromium --reporter=list

const baseURL = process.env.PW_BASE_URL || 'http://localhost:8080';

export default defineConfig({
  testDir: 'tests',
  timeout: 240_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
  },
  // No webServer: we target an already running live/dev server via baseURL
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

