import { mkdir } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const eventId = 'event-frontend-summit';
const eventTitle = '前端體驗設計小聚';

test.afterEach(async ({ page }) => {
  await page.evaluate(async (id) => {
    await fetch(`/api/saved-events/${id}`, { method: 'DELETE', credentials: 'same-origin' });
  }, eventId).catch(() => undefined);
});

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
  await page.evaluate(async (id) => {
    await fetch(`/api/saved-events/${id}`, { method: 'DELETE', credentials: 'same-origin' });
  }, eventId);
});

test('browser test double：save_event 成功後同步活動卡、詳情與收藏清單', async ({ page }) => {
  await installRegisteredToolsBrowserTestDouble(page);
  await establishEmptySavedEventsState(page);

  const eventCard = page.locator(`[data-event-id="${eventId}"]`);
  await eventCard.getByRole('button', { name: '查看詳情' }).click();
  await expect.poll(() => readRegisteredToolNames(page)).toContain('save_event');

  const rawResponse = await page.evaluate(async (id) => {
    const context = (document as Document & {
      modelContext: {
        getTools(): Promise<readonly { name: string }[]>;
        executeTool(tool: { name: string }, input: string): Promise<string>;
      };
    }).modelContext;
    const tool = (await context.getTools()).find((candidate) => candidate.name === 'save_event');

    if (tool === undefined) {
      throw new Error('browser test double 找不到 save_event。');
    }

    return context.executeTool(tool, JSON.stringify({ eventId: id }));
  }, eventId);

  expect(JSON.parse(rawResponse)).toMatchObject({ status: 'ok', eventId, saved: true });
  await expect(eventCard.getByRole('button', { name: '已收藏' })).toBeVisible();
  await expect(page.getByTestId('event-detail-saved-state')).toContainText('已收藏');
  await expect(page.getByTestId('saved-events-list')).toContainText(eventTitle);
});

test('Day 22：saved-events hydration 必須等待 Demo session 成功完成', async ({ page }) => {
  await installDelayedDemoSessionFetch(page);
  await page.goto('/');

  await expect.poll(() => readRequestOrder(page)).toEqual(['demo-session:start']);
  await releaseDemoSession(page);
  await expect.poll(() => readRequestOrder(page)).toEqual([
    'demo-session:start',
    'demo-session:complete',
    'saved-events:list:start'
  ]);
});

async function establishEmptySavedEventsState(page: Page): Promise<void> {
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
  await expect(page.getByTestId('saved-events-list')).toContainText('尚未收藏任何活動');
}

async function installRegisteredToolsBrowserTestDouble(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type RegisteredTool = {
      readonly name: string;
      readonly description: string;
      readonly inputSchema: Record<string, unknown>;
      readonly execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
    };
    const registrations: Array<{ tool: RegisteredTool; signal?: AbortSignal }> = [];

    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        async registerTool(tool: RegisteredTool, options?: { signal?: AbortSignal }) {
          registrations.push({ tool, signal: options?.signal });
        },
        async getTools() {
          return registrations
            .filter((registration) => !registration.signal?.aborted)
            .map(({ tool }) => ({ name: tool.name }));
        },
        async executeTool(tool: { name: string }, inputJson: string) {
          const registration = registrations.find((candidate) => (
            !candidate.signal?.aborted && candidate.tool.name === tool.name
          ));

          if (registration === undefined) {
            throw new Error(`browser test double 找不到已註冊的 Tool：${tool.name}`);
          }

          return registration.tool.execute(JSON.parse(inputJson) as Record<string, unknown>);
        }
      }
    });
  });
}

async function readRegisteredToolNames(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const context = (document as Document & {
      modelContext: { getTools(): Promise<readonly { name: string }[]> };
    }).modelContext;

    return (await context.getTools()).map((tool) => tool.name);
  });
}

async function installDelayedDemoSessionFetch(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const requestOrder: string[] = [];
    let releaseSession = (): void => {};
    const sessionGate = new Promise<void>((resolve) => {
      releaseSession = resolve;
    });
    const originalFetch = window.fetch.bind(window);

    Object.defineProperty(window, '__day22RequestOrder', {
      configurable: true,
      value: { requestOrder, releaseSession: () => releaseSession() }
    });
    window.fetch = async (...args) => {
      const input = args[0];
      const requestUrl = typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : input.toString();
      const method = args[1]?.method ?? (input instanceof Request ? input.method : 'GET');

      if (requestUrl.endsWith('/api/demo-session') && method === 'POST') {
        requestOrder.push('demo-session:start');
        await sessionGate;
        const response = await originalFetch(...args);
        requestOrder.push('demo-session:complete');

        return response;
      }

      if (requestUrl.endsWith('/api/saved-events') && method === 'GET') {
        requestOrder.push('saved-events:list:start');
      }

      return originalFetch(...args);
    };
  });
}

async function readRequestOrder(page: Page): Promise<string[]> {
  return page.evaluate(() => (
    window as typeof window & { __day22RequestOrder: { requestOrder: string[] } }
  ).__day22RequestOrder.requestOrder);
}

async function releaseDemoSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    (
      window as typeof window & { __day22RequestOrder: { releaseSession: () => void } }
    ).__day22RequestOrder.releaseSession();
  });
}
