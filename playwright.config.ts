import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure', channel: 'msedge' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Edge'] } }, { name: 'mobile-layout', use: { ...devices['Desktop Edge'], viewport: { width: 390, height: 844 } } }],
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:3000', reuseExistingServer: false, timeout: 60_000 },
});
