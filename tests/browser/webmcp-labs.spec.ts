import { expect, test } from '@playwright/test';

test('網站以概念卡對比人類搜尋介面與結構化能力描述', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('webmcp-concept-card')).toContainText('search_events');
  await expect(page.getByTestId('webmcp-concept-card')).toContainText('這不是正式 Tool 註冊');
});

test('宣告式 Lab 顯示標註表單與非 Agent 的結構預覽', async ({ page }) => {
  await page.goto('/');

  const form = page.locator('#declarative-search-lab');
  await expect(form).toHaveAttribute('toolname', 'search_events_lab');
  await expect(form.getByLabel('活動關鍵字')).toHaveAttribute('toolparamdescription', '用於比對公開活動的關鍵字。');
  await expect(page.getByTestId('declarative-preview')).toContainText('教學結構預覽');
});
