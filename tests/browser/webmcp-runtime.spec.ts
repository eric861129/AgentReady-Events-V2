import { expect, test } from '@playwright/test';

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

  await expect(panel).toContainText('前端');
  await expect(panel).toContainText('status');
  await expect(panel).toContainText('ok');
});
