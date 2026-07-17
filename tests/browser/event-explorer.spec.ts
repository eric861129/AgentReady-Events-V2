import { expect, test } from '@playwright/test';

test('使用者可以搜尋活動並收藏結果', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('搜尋活動').fill('前端');
  await page.getByTestId('search-events-button').click();
  await expect(page.locator('article[data-event-id="event-frontend-summit"]')).toBeVisible();

  await page.getByRole('button', { name: '查看詳情' }).click();

  await expect(page.getByRole('dialog')).toContainText('從語意、效能到互動細節，重新檢視網頁體驗。');
  await page.getByRole('button', { name: '關閉詳情' }).click();

  const saveButton = page.getByRole('button', { name: '收藏活動' });
  await saveButton.click();

  await expect(page.getByRole('button', { name: '已收藏' })).toBeVisible();
});
