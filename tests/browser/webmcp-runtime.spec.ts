import { expect, test, type Page } from '@playwright/test';

test('一般瀏覽器未注入 browser test double 時誠實顯示不支援原生 WebMCP', async ({ page }) => {
  await page.goto('/');

  const panel = page.getByTestId('webmcp-runtime-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: '原生 WebMCP 證據面板' })).toBeVisible();
  await expect(panel).toContainText('document.modelContext 不可用');
  await expect(panel).not.toContainText('已透過 document.modelContext 註冊 search_events');
  await expect(page.getByTestId('native-tool-query')).toHaveValue('前端');
  await expect(page.getByTestId('native-tool-invoke')).toHaveText('用瀏覽器 API 驗證');
  await expect(panel).toContainText('這是瀏覽器 API 驗證，不是 AI Agent 對話。');
});

test('注入 document.modelContext browser test double 時顯示 discovery 與直接 invocation 原始證據', async ({ page }) => {
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
        async executeTool(name: string, input: Record<string, unknown>) {
          return { status: 'ok', name, input };
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
        async executeTool(name: string, input: Record<string, unknown>) {
          calls.push('executeTool');
          return { status: 'ok', name, input };
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
