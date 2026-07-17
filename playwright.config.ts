import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const usesExternalServer = process.env.PLAYWRIGHT_BASE_URL !== undefined;

export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL
  },
  webServer: usesExternalServer
    ? undefined
    : {
        command: 'npm.cmd run dev -- --port 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: true
      }
});
