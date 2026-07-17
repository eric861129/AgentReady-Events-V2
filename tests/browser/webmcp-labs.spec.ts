import { expect, test } from '@playwright/test';

test('網站以概念卡對比人類搜尋介面與結構化能力描述', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('webmcp-concept-card')).toContainText('search_events');
  await expect(page.getByTestId('webmcp-concept-card')).toContainText('這不是正式 Tool 註冊');
});
