import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const eventId = 'event-frontend-summit';
const eventTitle = '前端體驗設計小聚';

test('Day 22：人類收藏、重載、取消與復原都以 server state 同步 UI', async ({ page }) => {
  const demoSessionResponse = page.waitForResponse((response) => (
    response.url().includes('/api/demo-session') && response.request().method() === 'POST'
  ));
  const initialSavedEventsResponse = page.waitForResponse((response) => (
    response.url().includes('/api/saved-events') && response.request().method() === 'GET'
  ));

  await page.goto('/');
  await Promise.all([demoSessionResponse, initialSavedEventsResponse]);
  await page.evaluate(async (id) => {
    await fetch(`/api/saved-events/${id}`, { method: 'DELETE', credentials: 'same-origin' });
  }, eventId);

  const hydratedSavedEventsResponse = page.waitForResponse((response) => (
    response.url().includes('/api/saved-events') && response.request().method() === 'GET'
  ));
  await page.reload();
  await hydratedSavedEventsResponse;

  const savedEventsMutationMethods: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes(`/api/saved-events/${eventId}`)) {
      savedEventsMutationMethods.push(request.method());
    }
  });

  const eventCard = page.locator(`[data-event-id="${eventId}"]`);
  await expect(eventCard.getByRole('button', { name: '收藏活動' })).toBeVisible();
  await expect(page.getByTestId('saved-events-list')).toContainText('尚未收藏任何活動');
  await eventCard.getByRole('button', { name: '查看詳情' }).click();
  await expect(page.getByTestId('event-detail-saved-state')).toContainText('尚未收藏');
  await page.getByRole('button', { name: '關閉詳情' }).click();

  await eventCard.getByRole('button', { name: '收藏活動' }).click();
  await expect(eventCard.getByRole('button', { name: '已收藏' })).toBeVisible();
  await expect(page.getByTestId('saved-events-list')).toContainText(eventTitle);
  await eventCard.getByRole('button', { name: '查看詳情' }).click();
  await expect(page.getByTestId('event-detail-saved-state')).toContainText('已收藏');
  await page.getByRole('button', { name: '關閉詳情' }).click();

  await page.reload();
  await expect(page.locator(`[data-event-id="${eventId}"]`).getByRole('button', { name: '已收藏' })).toBeVisible();
  await expect(page.getByTestId('saved-events-list')).toContainText(eventTitle);

  await page.getByTestId(`remove-saved-${eventId}`).click();
  await expect(page.locator(`[data-event-id="${eventId}"]`).getByRole('button', { name: '收藏活動' })).toBeVisible();
  await expect(page.getByTestId('saved-events-undo')).toBeVisible();
  expect(savedEventsMutationMethods).toContain('DELETE');
  await page.locator(`[data-event-id="${eventId}"]`).getByRole('button', { name: '查看詳情' }).click();
  await expect(page.getByTestId('event-detail-saved-state')).toContainText('尚未收藏');
  await page.getByRole('button', { name: '關閉詳情' }).click();

  await page.getByTestId('saved-events-undo').click();
  await expect(page.locator(`[data-event-id="${eventId}"]`).getByRole('button', { name: '已收藏' })).toBeVisible();
  await expect(page.getByTestId('saved-events-list')).toContainText(eventTitle);
  expect(savedEventsMutationMethods.filter((method) => method === 'PUT')).toHaveLength(2);

  await mkdir('output/playwright', { recursive: true });
  await page.screenshot({ path: 'output/playwright/day-22-visible-tool-state.png', fullPage: true });
});
