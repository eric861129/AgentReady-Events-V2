import { expect, test, type Page } from '@playwright/test';

const eventId = 'event-frontend-summit';

test('Day 24：browser test double 記錄 detailUrl、一般導覽與 route-aware Tool 清單', async ({ page }, testInfo) => {
  await installToolLifecycleBrowserTestDouble(page);

  await page.goto('/');
  await expect.poll(() => readRegisteredToolNames(page)).toEqual(['search_events']);
  const searchResult = await executeRegisteredTool(page, 'search_events', { query: '前端' });
  const detailUrl = String(searchResult.results?.[0]?.detailUrl ?? '');
  expect(detailUrl).toBe(`http://127.0.0.1:4173/?event=${eventId}`);

  await page.goto(detailUrl);
  await expect(page).toHaveURL(`/?event=${eventId}`);
  await expect.poll(() => readRegisteredToolNames(page)).toEqual([
    'get_event_details',
    'save_event'
  ]);

  const mutationRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/saved-events/') && request.method() === 'PUT') {
      mutationRequests.push(request.url());
    }
  });
  const mismatchedDetails = await executeRegisteredTool(page, 'get_event_details', {
    eventId: 'event-api-contract'
  });
  const mismatchedSave = await executeRegisteredTool(page, 'save_event', {
    eventId: 'event-api-contract'
  });
  expect(mismatchedDetails).toMatchObject({ status: 'error', errorCode: 'ROUTE_MISMATCH' });
  expect(mismatchedSave).toMatchObject({ status: 'error', errorCode: 'ROUTE_MISMATCH' });
  expect(mutationRequests).toEqual([]);

  await page.goto('/');
  await expect.poll(() => readRegisteredToolNames(page)).toEqual(['search_events']);

  const evidence = {
    evidenceBoundary: 'browser test double，不是原生 Chrome Agent discovery 證據',
    searchResultDetailUrl: detailUrl,
    browserNavigationUrl: `http://127.0.0.1:4173/?event=${eventId}`,
    toolLists: {
      search: ['search_events'],
      detail: ['get_event_details', 'save_event'],
      backToSearch: ['search_events']
    }
  };
  await testInfo.attach('day-24-tool-lifecycle.json', {
    body: Buffer.from(JSON.stringify(evidence, null, 2), 'utf8'),
    contentType: 'application/json'
  });
});

test('Day 24：未知 event route 顯示 not-found 且不註冊詳情 Tool', async ({ page }) => {
  await installToolLifecycleBrowserTestDouble(page);

  await page.goto('/?event=event-does-not-exist');

  await expect(page.getByTestId('event-not-found')).toBeVisible();
  await expect(page.getByTestId('webmcp-runtime-panel')).toContainText(
    '目前 route 不提供 WebMCP Tool。'
  );
  await expect.poll(() => readRegisteredToolNames(page)).toEqual([]);
});

async function installToolLifecycleBrowserTestDouble(page: Page): Promise<void> {
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

async function executeRegisteredTool(
  page: Page,
  toolName: string,
  input: Record<string, unknown>
): Promise<Record<string, any>> {
  return page.evaluate(async ({ name, rawInput }) => {
    const context = (document as Document & {
      modelContext: {
        getTools(): Promise<readonly { name: string }[]>;
        executeTool(tool: { name: string }, inputJson: string): Promise<string>;
      };
    }).modelContext;
    const tool = (await context.getTools()).find((candidate) => candidate.name === name);

    if (tool === undefined) {
      throw new Error(`browser test double 找不到 Tool：${name}`);
    }

    return JSON.parse(await context.executeTool(tool, JSON.stringify(rawInput))) as Record<string, any>;
  }, { name: toolName, rawInput: input });
}
