import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from '@playwright/test';
import { createSearchEventsTool } from '../src/webmcp/search-events-tool';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(currentDirectory, '..');
const outputDirectory = path.join(projectDirectory, 'docs', 'evidence', 'assets');
const baseUrl = process.env.DAY_28_CAPTURE_BASE_URL ?? 'http://127.0.0.1:4174';
const screenshotPath = path.join(outputDirectory, 'day-28-button-copy-comparison.png');
const jsonPath = path.join(outputDirectory, 'day-28-tool-result.json');
const viteProcess = process.env.DAY_28_CAPTURE_BASE_URL === undefined
  ? startViteServer()
  : undefined;

try {
  await waitForServer(baseUrl);
  await mkdir(outputDirectory, { recursive: true });

  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

    const legacyButton = page.getByRole('button', { name: '搜尋活動', exact: true });
    const actualButton = page.getByTestId('search-events-button');

    if (await legacyButton.count() !== 0) {
      throw new Error('Day 5 原始 locator 意外找到了「搜尋活動」按鈕，無法建立預期對照。');
    }

    const actualButtonText = await actualButton.textContent();

    if (actualButtonText !== '開始搜尋') {
      throw new Error(`目前按鈕文案不是預期的「開始搜尋」：${String(actualButtonText)}`);
    }

    const rawToolOutput = await createSearchEventsTool({
      detailUrlFor: (eventId) => new URL(`/?event=${eventId}`, page.url()).href
    }).execute({ query: '前端' });

    if (typeof rawToolOutput !== 'string') {
      throw new Error('正式 search_events Tool 必須回傳 JSON 字串。');
    }

    const parsedToolOutput = JSON.parse(rawToolOutput) as {
      readonly status?: unknown;
      readonly results?: readonly { readonly eventId?: unknown; }[];
    };

    if (
      parsedToolOutput.status !== 'ok'
      || parsedToolOutput.results?.[0]?.eventId !== 'event-frontend-summit'
    ) {
      throw new Error('正式 search_events Tool 沒有回傳預期的 event-frontend-summit。');
    }

    await addComparisonPanel(page, { actualButtonText, rawToolOutput });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await writeFile(jsonPath, `${JSON.stringify({
      query: '前端',
      rawToolOutput,
      boundary: 'Tool 直接執行；不是原生 Agent，也不代表 WebMCP 取代 UI 測試。'
    }, null, 2)}\n`, 'utf8');
  } finally {
    await browser.close();
  }

  console.log(`Day 28 截圖已保存：${screenshotPath}`);
  console.log(`Day 28 Tool JSON 已保存：${jsonPath}`);
} finally {
  await stopViteServer(viteProcess);
}

function startViteServer(): ChildProcess {
  const viteCli = path.join(projectDirectory, 'node_modules', 'vite', 'bin', 'vite.js');
  const port = new URL(baseUrl).port;

  return spawn(process.execPath, [viteCli, '--host', '127.0.0.1', '--port', port, '--strictPort'], {
    cwd: projectDirectory,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

async function waitForServer(url: string): Promise<void> {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Vite 尚未完成啟動，繼續等待。
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Vite 未能在 15 秒內於 ${url} 啟動。`);
}

async function stopViteServer(server: ChildProcess | undefined): Promise<void> {
  if (server === undefined || server.exitCode !== null) {
    return;
  }

  server.kill();

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 5_000);
    server.once('close', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function addComparisonPanel(
  page: Page,
  evidence: { readonly actualButtonText: string; readonly rawToolOutput: string; }
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
    panel.className = 'day-28-comparison';
    const title = document.createElement('h2');
    title.textContent = 'Day 28：按鈕文案與 Tool contract 的並列證據';
    const boundary = document.createElement('p');
    boundary.className = 'day-28-comparison__boundary';
    boundary.textContent = '測試注入的證據面板：Tool 是直接執行，不是原生 Agent；這不代表 WebMCP 取代 UI 測試。';
    const columns = document.createElement('div');
    columns.className = 'day-28-comparison__columns';

    const columnDefinitions = [
      {
        heading: 'Browser Automation：預期失敗',
        className: 'day-28-comparison__column day-28-comparison__column--failure',
        rows: [
          ['固定 locator', "getByRole('button', { name: '搜尋活動', exact: true })"],
          ['實際按鈕文案', data.actualButtonText],
          ['結果', '找不到「搜尋活動」按鈕，因此 Day 5 Playwright 實驗逾時失敗。']
        ]
      },
      {
        heading: '正式 Tool：直接執行成功',
        className: 'day-28-comparison__column day-28-comparison__column--success',
        rows: [
          ['輸入', '{ "query": "前端" }'],
          ['結果', '回傳 event-frontend-summit。'],
          ['raw JSON', data.rawToolOutput]
        ]
      }
    ];

    for (const definition of columnDefinitions) {
      const column = document.createElement('section');
      column.className = definition.className;
      const heading = document.createElement('h3');
      heading.textContent = definition.heading;
      column.append(heading);

      for (const [label, value] of definition.rows) {
        const paragraph = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = `${label}：`;
        const code = document.createElement('code');
        code.textContent = value;
        paragraph.append(strong, code);
        column.append(paragraph);
      }

      columns.append(column);
    }
    panel.append(title, boundary, columns);
    document.body.prepend(panel);
  }, evidence);
}
