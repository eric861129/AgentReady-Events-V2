import { expect, test, type Page } from '@playwright/test';

const canonicalEventId = 'event-frontend-summit';
const rejectedEventId = 'event-api-contract';

test.beforeEach(async ({ page }) => {
  const sessionReady = page.waitForResponse((response) => (
    response.request().method() === 'POST'
    && response.url().endsWith('/api/demo-session')
  ));
  const savedListReady = page.waitForResponse((response) => (
    response.request().method() === 'GET'
    && response.url().endsWith('/api/saved-events')
  ));

  await page.goto(`/?event=${canonicalEventId}`);
  await Promise.all([sessionReady, savedListReady]);
  await removeSavedEvent(page, canonicalEventId);
  await removeSavedEvent(page, rejectedEventId);
  await page.reload();
  await expect(page.getByTestId('event-detail-saved-state')).toContainText('收藏狀態：尚未收藏');
});

test('Day 26：DOM 假象與偽造 userId 都不能改變 server session 收藏狀態', async ({
  page
}, testInfo) => {
  const before = await readSavedEvents(page);

  expect(before).toMatchObject({
    status: 200,
    body: { status: 'ok', eventIds: expect.any(Array) }
  });

  await page.evaluate(() => {
    const savedState = document.querySelector<HTMLElement>('[data-testid="event-detail-saved-state"] strong');
    const savedList = document.querySelector<HTMLElement>('[data-testid="saved-events-list"]');

    if (savedState !== null) {
      savedState.textContent = '已收藏（僅 DOM 假象）';
    }

    savedList?.insertAdjacentHTML(
      'beforeend',
      '<p data-testid="dom-only-forgery">這段文字只存在於本機 DOM，尚未寫入 server。</p>'
    );
  });

  await expect(page.getByTestId('event-detail-saved-state')).toContainText('僅 DOM 假象');
  await expect(page.getByTestId('dom-only-forgery')).toBeVisible();
  expect(await readSavedEvents(page)).toEqual(before);

  const rejection = await page.evaluate(async (eventId) => {
    const response = await fetch(`/api/saved-events/${encodeURIComponent(eventId)}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: 'another-user' })
    });

    return {
      status: response.status,
      body: await response.json() as Record<string, unknown>
    };
  }, rejectedEventId);
  const after = await readSavedEvents(page);

  expect(rejection).toMatchObject({
    status: 400,
    body: {
      status: 'error',
      errorCode: 'UNEXPECTED_IDENTITY_FIELD'
    }
  });
  expect(after).toEqual(before);
  expect(after.status).toBe(200);
  expect(after.body.eventIds).not.toContain(rejectedEventId);

  await page.reload();
  await expect(page.getByTestId('dom-only-forgery')).toHaveCount(0);
  await expect(page.getByTestId('event-detail-saved-state')).toContainText('收藏狀態：尚未收藏');
  expect(await readSavedEvents(page)).toEqual(before);

  await testInfo.attach('day-26-trusted-boundary.json', {
    body: Buffer.from(JSON.stringify({
      evidenceBoundary: 'DOM 修改只是本機反例；API response 與 session state 才是寫入判斷。',
      before,
      rejection,
      after
    }, null, 2), 'utf8'),
    contentType: 'application/json'
  });
});

async function readSavedEvents(page: Page): Promise<{
  readonly status: number;
  readonly body: {
    readonly status?: string;
    readonly eventIds?: readonly string[];
    readonly errorCode?: string;
  };
}> {
  return page.evaluate(async () => {
    const response = await fetch('/api/saved-events', {
      method: 'GET',
      credentials: 'same-origin'
    });

    return {
      status: response.status,
      body: await response.json() as {
        readonly status?: string;
        readonly eventIds?: readonly string[];
        readonly errorCode?: string;
      }
    };
  });
}

async function removeSavedEvent(page: Page, eventId: string): Promise<void> {
  const result = await page.evaluate(async (targetEventId) => {
    const response = await fetch(`/api/saved-events/${encodeURIComponent(targetEventId)}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });

    return { status: response.status, body: await response.json() as Record<string, unknown> };
  }, eventId);

  expect(result).toMatchObject({ status: 200, body: { status: 'ok' } });
}
