import { expect, test, type Page } from '@playwright/test';

test('一般瀏覽器未注入 browser test double 時誠實顯示不支援原生 WebMCP', async ({ page }) => {
  await page.goto('/');

  const humanSearchBaseline = page.locator('.intro p').last();
  await expect(humanSearchBaseline).toContainText('供人類搜尋與收藏活動的操作基線');
  await expect(humanSearchBaseline).not.toContainText('尚未加入 WebMCP');

  const panel = page.getByTestId('webmcp-runtime-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: '原生 WebMCP 證據面板' })).toBeVisible();
  await expect(panel).toContainText('Day 15｜Browser runtime observation');
  await expect(panel).toContainText('Browser API observation');
  await expect(panel).toContainText(
    '此清單是 document.modelContext.getTools() 的 Browser observation，不是 Gemini／AI Agent discovery；真實 Agent／Inspector 證據會另行手動記錄。'
  );
  await expect(panel).not.toContainText('Day 15｜Agent Discovery');
  await expect(panel).toContainText('document.modelContext 不可用');
  await expect(panel).not.toContainText('已透過 document.modelContext 註冊 search_events');
  await expect(page.getByTestId('native-tool-query')).toHaveValue('前端');
  await expect(page.getByTestId('native-tool-invoke')).toHaveText('用瀏覽器 API 驗證');
  await expect(panel).toContainText('這是瀏覽器 API 驗證，不是 AI Agent 對話。');
});

test('注入 document.modelContext browser test double 時顯示 Browser observation 與直接 invocation 原始證據', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        async registerTool() {},
        async getTools() {
          return [
            {
              name: 'search_events',
              description: 'Browser test double 提供的搜尋 Tool。',
              inputSchema: '{"type":"object"}'
            }
          ];
        },
        async executeTool(_tool: { name: string }, inputJson: string) {
          const input = JSON.parse(inputJson) as Record<string, unknown>;
          return {
            status: 'ok',
            appliedFilters: input,
            results: [
              {
                eventId: 'evt-frontend-001',
                title: '前端實作交流會',
                category: '前端',
                date: '2026-08-08',
                location: '台北',
                summary: 'Browser test double 的搜尋結果。'
              }
            ]
          };
        }
      }
    });
  });

  await page.goto('/');

  const panel = page.getByTestId('webmcp-runtime-panel');
  await expect(panel).toContainText('document.modelContext 可用');
  await expect(panel).toContainText('search_events');

  await page.getByTestId('native-tool-invoke').click();

  const evidenceLog = panel.getByTestId('runtime-evidence-log');
  await expect(evidenceLog).toContainText('前端');
  await expect(evidenceLog).toContainText('status');
  await expect(evidenceLog).toContainText('ok');
  await expect(evidenceLog).toContainText('eventId');
  await expect(evidenceLog).toContainText('前端實作交流會');
  await expect(evidenceLog).toContainText('2026-08-08');
  await expect(evidenceLog).toContainText('台北');
});

test('受控暫時失敗情境會在直接證據面板顯示 TEMPORARY_UNAVAILABLE', async ({ page }) => {
  await installRegisteredToolBrowserTestDouble(page);
  await page.goto('/?evidenceScenario=temporary-unavailable');

  const panel = page.getByTestId('webmcp-runtime-panel');
  await expect(panel).toContainText('已透過 document.modelContext 註冊 search_events');

  await page.getByTestId('native-tool-invoke').click();

  const evidenceLog = panel.getByTestId('runtime-evidence-log');
  await expect(evidenceLog).toContainText('前端');
  await expect(evidenceLog).toContainText('TEMPORARY_UNAVAILABLE');
});

test('browser test double：save_event 只在活動詳情顯示，且同一活動重複收藏保持冪等', async ({ page }) => {
  await installMultipleRegisteredToolsBrowserTestDouble(page);
  await page.goto('/');

  await expect.poll(() => readRegisteredToolNames(page)).toEqual(['search_events']);

  await page.evaluate(async (eventId) => {
    await fetch(`/api/saved-events/${eventId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
  }, 'event-frontend-summit');

  await page.locator('[data-event-id="event-frontend-summit"]')
    .getByRole('button', { name: '查看詳情' })
    .click();

  await expect.poll(() => readRegisteredToolNames(page)).toContain('save_event');

  const responses = await page.evaluate(async (eventId) => {
    const context = (document as Document & {
      modelContext: {
        getTools(): Promise<readonly { name: string }[]>;
        executeTool(tool: { name: string }, input: string): Promise<unknown>;
      };
    }).modelContext;
    const tool = (await context.getTools()).find((candidate) => candidate.name === 'save_event');

    if (tool === undefined) {
      throw new Error('browser test double 找不到 save_event。');
    }

    return [
      await context.executeTool(tool, JSON.stringify({ eventId })),
      await context.executeTool(tool, JSON.stringify({ eventId }))
    ];
  }, 'event-frontend-summit');

  expect(responses.map((response) => JSON.parse(response as string))).toEqual([
    {
      status: 'ok',
      eventId: 'event-frontend-summit',
      saved: true,
      changed: true
    },
    {
      status: 'ok',
      eventId: 'event-frontend-summit',
      saved: true,
      changed: false
    }
  ]);
});

test('browser test double：延遲 Demo session 完成後不會把已開啟詳情的 save_event 覆蓋掉', async ({ page }) => {
  await installMultipleRegisteredToolsBrowserTestDouble(page);
  await installDelayedDemoSessionFetch(page);
  await page.goto('/');

  await expect.poll(() => readDemoSessionState(page)).toMatchObject({ started: true });

  await page.locator('[data-event-id="event-frontend-summit"]')
    .getByRole('button', { name: '查看詳情' })
    .click();
  await expect.poll(() => readRegisteredToolNames(page)).toEqual([
    'save_event',
    'search_events'
  ]);

  await releaseDemoSession(page);
  await expect.poll(() => readDemoSessionState(page)).toMatchObject({ completed: true });
  await expect.poll(() => readRegistrationCount(page)).toBeGreaterThanOrEqual(3);

  await expect.poll(() => readRegisteredToolNames(page)).toEqual([
    'save_event',
    'search_events'
  ]);
});

test('延遲 document.modelContext browser test double 時依序完成註冊再 invocation 並保留輸入與最終證據', async ({ page }) => {
  await installDelayedModelContextBrowserTestDouble(page);
  await page.goto('/');

  await expect.poll(() => readRaceCalls(page)).toContain('registerTool:start');

  await page.getByLabel('搜尋活動').fill('尚未送出的搜尋');
  await page.getByTestId('native-tool-query').fill('產品');
  await page.getByTestId('native-tool-invoke').click();

  expect(await readRaceCalls(page)).not.toContain('executeTool');

  await releaseRaceGate(page, 'releaseRegistration');
  await expect.poll(() => readRaceCalls(page)).toContain('getTools:start');
  expect(await readRaceCalls(page)).not.toContain('executeTool');

  await releaseRaceGate(page, 'releaseDiscovery');

  const evidenceLog = page.getByTestId('runtime-evidence-log');
  await expect(evidenceLog).toContainText('產品');
  await expect(evidenceLog).toContainText('status');
  await expect(evidenceLog).toContainText('ok');
  await expect(page.getByLabel('搜尋活動')).toHaveValue('尚未送出的搜尋');
  await expect(page.getByTestId('native-tool-query')).toHaveValue('產品');

  const calls = await readRaceCalls(page);
  expect(calls.indexOf('registerTool:done')).toBeLessThan(calls.indexOf('executeTool'));
  expect(calls.indexOf('getTools:done')).toBeLessThan(calls.indexOf('executeTool'));
});

async function installDelayedModelContextBrowserTestDouble(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const calls: string[] = [];
    let releaseRegistrationGate = (): void => {};
    let releaseDiscoveryGate = (): void => {};
    const registrationGate = new Promise<void>((resolve) => {
      releaseRegistrationGate = resolve;
    });
    const discoveryGate = new Promise<void>((resolve) => {
      releaseDiscoveryGate = resolve;
    });

    Object.defineProperty(window, '__webMcpRaceControl', {
      configurable: true,
      value: {
        calls,
        releaseRegistration: () => releaseRegistrationGate(),
        releaseDiscovery: () => releaseDiscoveryGate()
      }
    });
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        async registerTool() {
          calls.push('registerTool:start');
          await registrationGate;
          calls.push('registerTool:done');
        },
        async getTools() {
          calls.push('getTools:start');
          await discoveryGate;
          calls.push('getTools:done');
          return [
            {
              name: 'search_events',
              description: '延遲 browser test double 提供的搜尋 Tool。',
              inputSchema: '{"type":"object"}'
            }
          ];
        },
        async executeTool(_tool: { name: string }, inputJson: string) {
          const input = JSON.parse(inputJson) as Record<string, unknown>;
          calls.push('executeTool');
          return {
            status: 'ok',
            appliedFilters: input,
            results: [
              {
                eventId: 'evt-product-001',
                title: '產品交流會',
                category: '產品',
                date: '2026-09-09',
                location: '林口',
                summary: '延遲 browser test double 的搜尋結果。'
              }
            ]
          };
        }
      }
    });
  });
}

async function readRaceCalls(page: Page): Promise<string[]> {
  return page.evaluate(() => (
    window as typeof window & { __webMcpRaceControl: { calls: string[] } }
  ).__webMcpRaceControl.calls);
}

async function releaseRaceGate(
  page: Page,
  gate: 'releaseRegistration' | 'releaseDiscovery'
): Promise<void> {
  await page.evaluate((gateName) => {
    const control = (
      window as typeof window & {
        __webMcpRaceControl: {
          releaseRegistration: () => void;
          releaseDiscovery: () => void;
        };
      }
    ).__webMcpRaceControl;
    control[gateName]();
  }, gate);
}

async function installRegisteredToolBrowserTestDouble(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type RegisteredTool = {
      readonly name: string;
      readonly execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
    };
    let registeredTool: RegisteredTool | undefined;

    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        async registerTool(tool: RegisteredTool) {
          registeredTool = tool;
        },
        async getTools() {
          return registeredTool === undefined
            ? []
            : [{
                name: registeredTool.name,
                description: '已註冊 Tool 的 browser test double。',
                inputSchema: '{"type":"object"}'
              }];
        },
        async executeTool(tool: { name: string }, inputJson: string) {
          if (registeredTool === undefined || tool.name !== registeredTool.name) {
            throw new Error('browser test double 找不到已註冊的 Tool。');
          }

          return registeredTool.execute(JSON.parse(inputJson) as Record<string, unknown>);
        }
      }
    });
  });
}

async function installMultipleRegisteredToolsBrowserTestDouble(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type RegisteredTool = {
      readonly name: string;
      readonly description: string;
      readonly inputSchema: Record<string, unknown>;
      readonly execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
    };
    const registrations: Array<{ tool: RegisteredTool; signal?: AbortSignal }> = [];

    Object.defineProperty(window, '__webMcpRegistrationLog', {
      configurable: true,
      value: registrations
    });

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

async function installDelayedDemoSessionFetch(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let releaseGate = (): void => {};
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const control = {
      started: false,
      completed: false,
      release: () => releaseGate()
    };
    const originalFetch = window.fetch.bind(window);

    Object.defineProperty(window, '__demoSessionControl', {
      configurable: true,
      value: control
    });
    window.fetch = async (...args) => {
      const input = args[0];
      const url = typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : input.toString();

      if (url.endsWith('/api/demo-session')) {
        control.started = true;
        await gate;
        const response = await originalFetch(...args);
        control.completed = true;

        return response;
      }

      return originalFetch(...args);
    };
  });
}

async function readRegisteredToolNames(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const context = (document as Document & {
      modelContext: { getTools(): Promise<readonly { name: string }[]> };
    }).modelContext;

    return (await context.getTools()).map((tool) => tool.name).sort();
  });
}

async function readRegistrationCount(page: Page): Promise<number> {
  return page.evaluate(() => (
    window as typeof window & { __webMcpRegistrationLog: unknown[] }
  ).__webMcpRegistrationLog.length);
}

async function readDemoSessionState(page: Page): Promise<{
  readonly started: boolean;
  readonly completed: boolean;
}> {
  return page.evaluate(() => {
    const control = (
      window as typeof window & {
        __demoSessionControl: { started: boolean; completed: boolean };
      }
    ).__demoSessionControl;

    return { started: control.started, completed: control.completed };
  });
}

async function releaseDemoSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    (
      window as typeof window & { __demoSessionControl: { release: () => void } }
    ).__demoSessionControl.release();
  });
}
