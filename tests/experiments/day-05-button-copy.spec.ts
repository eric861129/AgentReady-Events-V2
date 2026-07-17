import { expect, test } from '@playwright/test';

test('搜尋按鈕完整文案可驅動固定活動查詢', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('搜尋活動').fill('前端');
  await page.getByRole('button', { name: '搜尋活動', exact: true }).click();

  await expect(page.locator('article[data-event-id="event-frontend-summit"]')).toBeVisible();
});
