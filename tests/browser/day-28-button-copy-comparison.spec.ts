import { expect, test } from '@playwright/test';
import { createSearchEventsTool } from '../../src/webmcp/search-events-tool';

test('Day 5 按鈕文案失敗與正式 Tool 直接執行可並列驗證', async ({ page }, testInfo) => {
  await page.goto('/');

  const legacyLocator = "getByRole('button', { name: '搜尋活動', exact: true })";
  const legacyButton = page.getByRole('button', { name: '搜尋活動', exact: true });
  const actualButton = page.getByTestId('search-events-button');

  await expect(legacyButton).toHaveCount(0);
  await expect(actualButton).toHaveText('開始搜尋');

  const rawToolOutput = await createSearchEventsTool({
    detailUrlFor: (eventId) => new URL(`/?event=${eventId}`, page.url()).href
  }).execute({ query: '前端' });

  expect(typeof rawToolOutput).toBe('string');

  if (typeof rawToolOutput !== 'string') {
    throw new Error('正式 search_events Tool 必須回傳 JSON 字串。');
  }

  expect(JSON.parse(rawToolOutput)).toMatchObject({
    status: 'ok',
    results: [{ eventId: 'event-frontend-summit' }]
  });

  await addComparisonPanel(page, {
    legacyLocator,
    actualButtonText: await actualButton.textContent() ?? '',
    rawToolOutput
  });

  await testInfo.attach('day-28-tool-result.json', {
    body: Buffer.from(JSON.stringify({
      query: '前端',
      rawToolOutput,
      boundary: 'Tool 直接執行；不是原生 Agent，也不代表 WebMCP 取代 UI 測試。'
    }, null, 2)),
    contentType: 'application/json'
  });
  await testInfo.attach('day-28-button-copy-comparison.png', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });
});

async function addComparisonPanel(
  page: import('@playwright/test').Page,
  evidence: { readonly legacyLocator: string; readonly actualButtonText: string; readonly rawToolOutput: string; }
): Promise<void> {
  await page.evaluate((data) => {
    const style = document.createElement('style');
    style.textContent = `
      .day-28-comparison { margin: 24px auto; width: min(1180px, calc(100% - 48px)); padding: 24px; border: 2px solid #315ac7; border-radius: 16px; color: #17213a; background: #f4f7fc; font-family: "Noto Sans TC", "Microsoft JhengHei", sans-serif; }
      .day-28-comparison h2 { margin: 0 0 8px; font-size: 28px; }
      .day-28-comparison__boundary { margin: 0 0 18px; padding: 12px; border-radius: 10px; color: #6f3c00; background: #fff1d6; font-weight: 700; }
      .day-28-comparison__columns { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
      .day-28-comparison__column { min-width: 0; padding: 18px; border-radius: 12px; background: #ffffff; }
      .day-28-comparison__column--failure { border: 2px solid #b42318; }
      .day-28-comparison__column--success { border: 2px solid #157347; }
      .day-28-comparison h3 { margin: 0 0 10px; font-size: 20px; }
      .day-28-comparison p { margin: 8px 0; line-height: 1.55; }
      .day-28-comparison code { display: block; padding: 10px; overflow-wrap: anywhere; border-radius: 8px; color: #ecf2ff; background: #17213a; font-family: Consolas, monospace; white-space: pre-wrap; }
    `;
    document.head.append(style);

    const panel = document.createElement('section');
    panel.dataset.testid = 'day-28-comparison-evidence';
    panel.className = 'day-28-comparison';
    const title = document.createElement('h2');
    title.textContent = 'Day 28：按鈕文案與 Tool contract 的並列證據';
    const boundary = document.createElement('p');
    boundary.className = 'day-28-comparison__boundary';
    boundary.textContent = '測試注入的證據面板：Tool 是直接執行，不是原生 Agent；這不代表 WebMCP 取代 UI 測試。';
    const columns = document.createElement('div');
    columns.className = 'day-28-comparison__columns';

    const browserColumn = createColumn(
      'Browser Automation：預期失敗',
      'day-28-comparison__column day-28-comparison__column--failure',
      [
        ['固定 locator', data.legacyLocator],
        ['實際按鈕文案', data.actualButtonText],
        ['結果', '找不到「搜尋活動」按鈕，因此 Day 5 Playwright 實驗逾時失敗。']
      ]
    );
    const toolColumn = createColumn(
      '正式 Tool：直接執行成功',
      'day-28-comparison__column day-28-comparison__column--success',
      [
        ['輸入', '{ "query": "前端" }'],
        ['結果', '回傳 event-frontend-summit。'],
        ['raw JSON', data.rawToolOutput]
      ]
    );

    columns.append(browserColumn, toolColumn);
    panel.append(title, boundary, columns);
    document.body.prepend(panel);

    function createColumn(
      headingText: string,
      className: string,
      rows: readonly (readonly [string, string])[]
    ): HTMLElement {
      const column = document.createElement('section');
      column.className = className;
      const heading = document.createElement('h3');
      heading.textContent = headingText;
      column.append(heading);

      for (const [label, value] of rows) {
        const paragraph = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = `${label}：`;
        const code = document.createElement('code');
        code.textContent = value;
        paragraph.append(strong, code);
        column.append(paragraph);
      }

      return column;
    }
  }, evidence);
}
