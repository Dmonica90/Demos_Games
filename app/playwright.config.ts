import { defineConfig, devices } from '@playwright/test';

/**
 * The tests drive the production build with the in-browser backend
 * (`?local=1`): the host and the "phones" are pages of one browser context, so
 * they share localStorage and BroadcastChannel, like a real session shares
 * Supabase. Chromium is preinstalled here; `PW_CHROMIUM` points elsewhere.
 */
const executablePath = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'es-MX',
    trace: 'retain-on-failure',
    launchOptions: { executablePath },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } }],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
