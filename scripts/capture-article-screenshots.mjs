import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(currentDirectory, '..');
const assetDirectory = process.env.ARTICLE_ASSET_DIR ?? path.resolve(projectDirectory, '..', 'WEBMCP-iThome-2026-Draft-V2', 'assets');
const baseURL = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:4173';

await Promise.all([
  mkdir(path.join(assetDirectory, 'day-01'), { recursive: true }),
  mkdir(path.join(assetDirectory, 'day-03'), { recursive: true })
]);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });

try {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(assetDirectory, 'day-01', 'event-site-baseline.png'), fullPage: true });

  await page.getByLabel('搜尋活動').fill('前端');
  await page.getByRole('button', { name: '搜尋活動' }).click();
  await page.getByRole('heading', { name: '前端體驗設計小聚' }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(assetDirectory, 'day-03', 'search-results.png'), fullPage: true });

  await page.getByRole('button', { name: '查看詳情' }).click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({ path: path.join(assetDirectory, 'day-03', 'event-detail.png'), fullPage: true });
} finally {
  await browser.close();
}
