import { expect, test, type Page } from '@playwright/test';
import {
  runDay25AgentJourneyTestDouble,
  type Day25JourneyTestDoubleAttachment,
  type Day25JourneyTestDoubleClient
} from '../support/day-25-agent-journey-test-double';

const canonicalEventId = 'event-frontend-summit';

test.beforeEach(async ({ page }) => {
  await installBrowserTestDouble(page);
  const sessionReady = page.waitForResponse((response) => (
    response.request().method() === 'POST'
    && response.url().endsWith('/api/demo-session')
  ));
  const savedListReady = page.waitForResponse((response) => (
    response.request().method() === 'GET'
    && response.url().endsWith('/api/saved-events')
  ));
  await page.goto('/');
  await Promise.all([sessionReady, savedListReady]);
  await expect.poll(() => readRegisteredToolNames(page)).toEqual(['search_events']);
  await clearSavedEvent(page, canonicalEventId);
  await page.reload();
  await expect.poll(() => readRegisteredToolNames(page)).toEqual(['search_events']);
  await expect(page.getByTestId('saved-events-list')).toContainText('尚未收藏任何活動');
});

test('Day 25 browser test double：完整 journey 保存 Tool input/output、detailUrl 導覽與收藏 UI evidence', async ({
  page
}, testInfo) => {
  const expectedDetailUrl = `http://127.0.0.1:4173/?event=${canonicalEventId}`;
  const result = await runDay25AgentJourneyTestDouble(
    createBrowserTestDoubleClient(page),
    { query: '前端' }
  );

  expect(result).toMatchObject({
    status: 'completed',
    eventId: canonicalEventId,
    detailUrl: expectedDetailUrl,
    saveResult: {
      status: 'ok',
      eventId: canonicalEventId,
      saved: true,
      changed: true
    }
  });
  await expect(page).toHaveURL(`/?event=${canonicalEventId}`);
  await expect(page.getByRole('dialog', { name: '前端體驗設計小聚' })).toBeVisible();
  await expect(page.getByTestId('event-detail-saved-state')).toContainText('收藏狀態：已收藏');

  const searchStep = result.steps.find((step) => (
    step.action === 'invoke' && step.toolName === 'search_events'
  ));
  expect(searchStep).toMatchObject({
    input: { query: '前端' },
    output: {
      status: 'ok',
      results: [{ eventId: canonicalEventId, detailUrl: expectedDetailUrl }]
    }
  });
  expect(result.steps.map((step) => (
    step.action === 'invoke' ? step.toolName : `navigate:${step.url}`
  ))).toEqual([
    'search_events',
    `navigate:${expectedDetailUrl}`,
    'get_event_details',
    'save_event'
  ]);
  expect(result.steps).toEqual([
    expect.objectContaining({
      action: 'invoke',
      toolName: 'search_events',
      availableTools: ['search_events'],
      uiEvidence: expect.arrayContaining([
        '搜尋結果：前端體驗設計小聚',
        `detailUrl：${expectedDetailUrl}`
      ])
    }),
    expect.objectContaining({
      action: 'navigate',
      availableTools: ['get_event_details', 'save_event'],
      uiEvidence: expect.arrayContaining([
        '活動詳情：前端體驗設計小聚',
        '收藏狀態：尚未收藏'
      ])
    }),
    expect.objectContaining({
      action: 'invoke',
      toolName: 'get_event_details',
      availableTools: ['get_event_details', 'save_event'],
      uiEvidence: expect.arrayContaining(['活動詳情：前端體驗設計小聚'])
    }),
    expect.objectContaining({
      action: 'invoke',
      toolName: 'save_event',
      availableTools: ['get_event_details', 'save_event'],
      uiEvidence: expect.arrayContaining(['收藏狀態：已收藏'])
    })
  ]);

  const attachment: Day25JourneyTestDoubleAttachment = {
    evidenceBoundary: 'Playwright browser test double；不是原生 Chrome Inspector 或真實 Agent discovery',
    result
  };
  const attachmentBody = Buffer.from(JSON.stringify(attachment, null, 2), 'utf8');
  const attachmentEvidence = JSON.parse(
    attachmentBody.toString('utf8')
  ) as Day25JourneyTestDoubleAttachment;
  expect(attachmentEvidence.result.steps).toHaveLength(4);
  expect(attachmentEvidence.result.steps.every((step) => (
    Array.isArray(step.availableTools)
    && Array.isArray(step.uiEvidence)
    && 'input' in step
    && 'output' in step
  ))).toBe(true);
  const invocationSteps = attachmentEvidence.result.steps.filter((step) => (
    step.action === 'invoke'
  ));
  expect(invocationSteps).toHaveLength(3);

  for (const step of invocationSteps) {
    expect(typeof step.rawOutput).toBe('string');

    expect(JSON.parse(step.rawOutput) as unknown).toEqual(step.output);
  }
  expect(attachmentEvidence.result.steps).toEqual([
    expect.objectContaining({
      action: 'invoke',
      toolName: 'search_events',
      availableTools: ['search_events'],
      uiEvidence: expect.arrayContaining(['搜尋結果：前端體驗設計小聚'])
    }),
    expect.objectContaining({
      action: 'navigate',
      availableTools: ['get_event_details', 'save_event'],
      uiEvidence: expect.arrayContaining(['收藏狀態：尚未收藏'])
    }),
    expect.objectContaining({
      action: 'invoke',
      toolName: 'get_event_details',
      availableTools: ['get_event_details', 'save_event'],
      uiEvidence: expect.arrayContaining(['活動詳情：前端體驗設計小聚'])
    }),
    expect.objectContaining({
      action: 'invoke',
      toolName: 'save_event',
      availableTools: ['get_event_details', 'save_event'],
      uiEvidence: expect.arrayContaining(['收藏狀態：已收藏'])
    })
  ]);

  await testInfo.attach('day-25-agent-journey-browser-test-double.json', {
    body: attachmentBody,
    contentType: 'application/json'
  });
});

test('Day 25 browser test double：空搜尋結果不導覽也不呼叫下一個 Tool', async ({ page }) => {
  const initialUrl = page.url();
  const realClient = createBrowserTestDoubleClient(page);
  const client: Day25JourneyTestDoubleClient = {
    ...realClient,
    async executeTool(toolName, input) {
      const rawOutput = await realClient.executeTool(toolName, input);
      return toolName === 'search_events'
        ? JSON.stringify({ status: 'ok', results: [] })
        : rawOutput;
    }
  };

  const result = await runDay25AgentJourneyTestDouble(client, { query: '前端' });

  expect(result).toMatchObject({ status: 'stopped', stopReason: 'EMPTY_RESULTS' });
  expect(result.steps.map((step) => step.action === 'invoke' ? step.toolName : step.action)).toEqual([
    'search_events'
  ]);
  expect(page.url()).toBe(initialUrl);
  await expect.poll(() => readRegisteredToolNames(page)).toEqual(['search_events']);
  await expect(page.getByTestId('event-detail-saved-state')).toHaveCount(0);
});

test('Day 25 browser test double：eventId 與 route mismatch 時停止且沒有收藏 request', async ({ page }) => {
  const mutationRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().includes('/api/saved-events/')) {
      mutationRequests.push(request.url());
    }
  });
  const realClient = createBrowserTestDoubleClient(page);
  const client: Day25JourneyTestDoubleClient = {
    ...realClient,
    async executeTool(toolName, input) {
      const rawOutput = await realClient.executeTool(toolName, input);
      const result = JSON.parse(rawOutput) as unknown;

      if (toolName !== 'search_events' || !isRecord(result)) {
        return rawOutput;
      }

      const firstResult = Array.isArray(result.results) && isRecord(result.results[0])
        ? result.results[0]
        : {};

      return JSON.stringify({
        ...result,
        results: [{
          ...firstResult,
          eventId: 'event-api-contract'
        }]
      });
    }
  };

  const result = await runDay25AgentJourneyTestDouble(client, { query: '前端' });

  expect(result).toMatchObject({
    status: 'stopped',
    stopReason: 'ROUTE_MISMATCH',
    eventId: 'event-api-contract',
    detailUrl: `http://127.0.0.1:4173/?event=${canonicalEventId}`
  });
  expect(result.steps.map((step) => step.action === 'invoke' ? step.toolName : 'navigate')).toEqual([
    'search_events',
    'navigate',
    'get_event_details'
  ]);
  expect(mutationRequests).toEqual([]);
  await expect(page).toHaveURL(`/?event=${canonicalEventId}`);
  await expect(page.getByTestId('event-detail-saved-state')).toContainText('收藏狀態：尚未收藏');
});

function createBrowserTestDoubleClient(page: Page): Day25JourneyTestDoubleClient {
  return {
    executeTool: (toolName, input) => executeRegisteredTool(page, toolName, input),
    async navigate(url) {
      await page.goto(url);
      await expect.poll(() => readRegisteredToolNames(page)).toEqual([
        'get_event_details',
        'save_event'
      ]);
      return page.url();
    },
    readAvailableTools: () => readRegisteredToolNames(page),
    readUiEvidence: () => readBrowserUiEvidence(page)
  };
}

async function readBrowserUiEvidence(page: Page): Promise<readonly string[]> {
  const dialog = page.getByRole('dialog');

  if (await dialog.count() > 0) {
    const title = await dialog.getByRole('heading').innerText();
    const savedState = await page.getByTestId('event-detail-saved-state')
      .locator('strong')
      .innerText();

    return [
      `活動詳情：${title}`,
      `收藏狀態：${savedState}`
    ];
  }

  const eventCard = page.locator(`[data-event-id="${canonicalEventId}"]`);
  const title = await eventCard.getByRole('heading').innerText();
  const detailUrl = await eventCard.getByRole('link', { name: '查看詳情' }).getAttribute('href');

  return [
    `搜尋結果：${title}`,
    `detailUrl：${detailUrl ?? 'missing'}`
  ];
}

async function installBrowserTestDouble(page: Page): Promise<void> {
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
            .map(({ tool }) => ({
              name: tool.name,
              description: tool.description,
              inputSchema: JSON.stringify(tool.inputSchema)
            }));
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

async function executeRegisteredTool(
  page: Page,
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  return page.evaluate(async ({ name, rawInput }) => {
    const context = (document as Document & {
      modelContext: {
        getTools(): Promise<readonly { name: string }[]>;
        executeTool(tool: { name: string }, inputJson: string): Promise<unknown>;
      };
    }).modelContext;
    const tool = (await context.getTools()).find((candidate) => candidate.name === name);

    if (tool === undefined) {
      throw new Error(`browser test double 找不到 Tool：${name}`);
    }

    const rawOutput = await context.executeTool(tool, JSON.stringify(rawInput));

    if (typeof rawOutput !== 'string') {
      throw new Error(`browser test double 的 Tool ${name} 未回傳 JSON string`);
    }

    return rawOutput;
  }, { name: toolName, rawInput: input });
}

async function readRegisteredToolNames(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const context = (document as Document & {
      modelContext: { getTools(): Promise<readonly { name: string }[]> };
    }).modelContext;

    return (await context.getTools()).map((tool) => tool.name);
  });
}

async function clearSavedEvent(page: Page, eventId: string): Promise<void> {
  const response = await page.evaluate(async (id) => {
    const result = await fetch(`/api/saved-events/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });

    return {
      status: result.status,
      body: await result.json() as unknown
    };
  }, eventId);

  expect(response).toMatchObject({
    status: 200,
    body: {
      status: 'ok',
      eventId,
      saved: false
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
