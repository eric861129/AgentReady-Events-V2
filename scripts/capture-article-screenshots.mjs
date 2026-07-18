import { chromium } from '@playwright/test';
import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);
const projectDirectory = path.resolve(currentDirectory, '..');
const projectParentDirectory = path.dirname(projectDirectory);
const repositoryDirectory = path.basename(projectParentDirectory) === '.worktrees'
  ? path.dirname(projectParentDirectory)
  : projectDirectory;
const assetDirectory = process.env.ARTICLE_ASSET_DIR
  ?? path.resolve(repositoryDirectory, '..', 'WEBMCP-iThome-2026-Draft-V2', 'assets');
const baseURL = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:4173';
const day14Ref = 'day-14-search-events-declaration';
const day14SourcePath = 'src/webmcp/search-events-tool.ts';
const [{ stdout: day14Source }, { stdout: day14CommitOutput }] = await Promise.all([
  execFileAsync('git', ['show', `${day14Ref}:${day14SourcePath}`], {
    cwd: projectDirectory,
    encoding: 'utf8'
  }),
  execFileAsync('git', ['rev-parse', day14Ref], {
    cwd: projectDirectory,
    encoding: 'utf8'
  })
]);
const day14Commit = day14CommitOutput.trim();

const articleDays = [
  'day-01',
  'day-03',
  'day-06',
  'day-11',
  'day-12',
  'day-13',
  'day-14',
  'day-15',
  'day-16',
  'day-17',
  'day-18'
];

await Promise.all(articleDays.map((day) => (
  mkdir(path.join(assetDirectory, day), { recursive: true })
)));

const browser = await chromium.launch();
const pageOptions = { viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 };
const page = await browser.newPage(pageOptions);

try {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(assetDirectory, 'day-01', 'event-site-baseline.png'), fullPage: true });

  await page.getByTestId('webmcp-concept-card').screenshot({
    path: path.join(assetDirectory, 'day-06', 'webmcp-concept.png')
  });

  await page.getByLabel('搜尋活動').fill('前端');
  await page.getByTestId('search-events-button').click();
  await page.getByRole('heading', { name: '前端體驗設計小聚' }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(assetDirectory, 'day-03', 'search-results.png'), fullPage: true });
  await screenshotSearchAndResults(
    page,
    path.join(assetDirectory, 'day-13', 'search-events-human-baseline.png')
  );

  const codeEvidencePage = await browser.newPage(pageOptions);
  await codeEvidencePage.setContent(renderDay14CodeEvidence({
    ref: day14Ref,
    commit: day14Commit,
    sourcePath: day14SourcePath,
    source: day14Source
  }));
  await codeEvidencePage.screenshot({
    path: path.join(assetDirectory, 'day-14', 'search-events-tool-declaration.png'),
    fullPage: true
  });

  await page.locator('section').filter({ has: page.locator('#declarative-search-lab') }).screenshot({
    path: path.join(assetDirectory, 'day-11', 'declarative-lab.png')
  });

  await page.getByRole('button', { name: '查看詳情' }).click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({ path: path.join(assetDirectory, 'day-03', 'event-detail.png'), fullPage: true });
  await page.getByRole('dialog').screenshot({
    path: path.join(assetDirectory, 'day-12', 'imperative-lab-unsupported-browser.png')
  });

  const testDoublePage = await browser.newPage(pageOptions);
  await installRegisteredToolBrowserTestDouble(testDoublePage);
  await testDoublePage.goto(baseURL, { waitUntil: 'networkidle' });

  const testDoublePanel = testDoublePage.getByTestId('webmcp-runtime-panel');
  await testDoublePanel.getByText('已透過 document.modelContext 註冊 search_events。').waitFor();
  await addBrowserTestDoubleDisclosure(testDoublePanel);
  await testDoublePanel.screenshot({
    path: path.join(assetDirectory, 'day-15', 'runtime-test-double-discovery.png')
  });

  await testDoublePage.getByTestId('native-tool-invoke').click();
  await testDoublePanel.getByTestId('runtime-evidence-log').getByText('前端體驗設計小聚').waitFor();
  await addBrowserTestDoubleDisclosure(testDoublePanel);
  await testDoublePanel.screenshot({
    path: path.join(assetDirectory, 'day-16', 'runtime-direct-invocation-test-double.png')
  });

  await testDoublePage.goto(`${baseURL}/?evidenceScenario=temporary-unavailable`, {
    waitUntil: 'networkidle'
  });
  const temporaryFailurePanel = testDoublePage.getByTestId('webmcp-runtime-panel');
  await temporaryFailurePanel.getByText('已透過 document.modelContext 註冊 search_events。').waitFor();
  await addBrowserTestDoubleDisclosure(temporaryFailurePanel);
  await testDoublePage.getByTestId('native-tool-invoke').click();
  await temporaryFailurePanel.getByTestId('runtime-evidence-log').getByText('TEMPORARY_UNAVAILABLE').waitFor();
  await addBrowserTestDoubleDisclosure(temporaryFailurePanel);
  await temporaryFailurePanel.screenshot({
    path: path.join(assetDirectory, 'day-18', 'runtime-temporary-unavailable-test-double.png')
  });

  console.log(`Article screenshots saved to ${assetDirectory}`);
} finally {
  await browser.close();
}

async function installRegisteredToolBrowserTestDouble(targetPage) {
  await targetPage.addInitScript(() => {
    let registeredTool;

    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        async registerTool(tool) {
          registeredTool = tool;
        },
        async getTools() {
          return registeredTool === undefined
            ? []
            : [{
                name: registeredTool.name,
                description: registeredTool.description,
                inputSchema: JSON.stringify(registeredTool.inputSchema)
              }];
        },
        async executeTool(name, input) {
          if (registeredTool === undefined || name !== registeredTool.name) {
            throw new Error('Browser test double 找不到已註冊的 Tool。');
          }

          return registeredTool.execute(input);
        }
      }
    });
  });
}

async function screenshotSearchAndResults(targetPage, screenshotPath) {
  const searchForm = targetPage.locator('#event-search-form');
  const eventResults = targetPage.locator('.event-results');
  await Promise.all([searchForm.waitFor(), eventResults.waitFor()]);
  await searchForm.evaluate((element) => {
    element.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -24);
  });

  const [searchFormBox, eventResultsBox] = await Promise.all([
    searchForm.boundingBox(),
    eventResults.boundingBox()
  ]);

  if (searchFormBox === null || eventResultsBox === null) {
    throw new Error('無法取得 Day 13 人類搜尋與結果區域。');
  }

  const padding = 16;
  const x = Math.max(0, Math.min(searchFormBox.x, eventResultsBox.x) - padding);
  const y = Math.max(0, Math.min(searchFormBox.y, eventResultsBox.y) - padding);
  const right = Math.max(
    searchFormBox.x + searchFormBox.width,
    eventResultsBox.x + eventResultsBox.width
  ) + padding;
  const bottom = Math.max(
    searchFormBox.y + searchFormBox.height,
    eventResultsBox.y + eventResultsBox.height
  ) + padding;

  await targetPage.screenshot({
    path: screenshotPath,
    clip: { x, y, width: right - x, height: bottom - y }
  });
}

function renderDay14CodeEvidence({ ref, commit, sourcePath, source }) {
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 48px;
        color: #17213a;
        background: #f4f7fc;
        font-family: Inter, "Noto Sans TC", "Microsoft JhengHei", sans-serif;
      }
      main {
        width: 100%;
        padding: 40px;
        border: 1px solid #c9d6f2;
        border-radius: 18px;
        background: #ffffff;
      }
      .label {
        margin: 0 0 8px;
        color: #315ac7;
        font-weight: 700;
      }
      h1 { margin: 0 0 16px; font-size: 32px; }
      .source { margin: 0 0 8px; font-family: Consolas, "Courier New", monospace; }
      .notice { margin: 0 0 24px; color: #8a5200; }
      pre {
        margin: 0;
        padding: 28px;
        overflow: visible;
        border-radius: 14px;
        color: #ecf2ff;
        background: #17213a;
        font: 16px/1.55 Consolas, "Courier New", monospace;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="label">Day 14｜Deterministic source code evidence</p>
      <h1>search_events Tool declaration</h1>
      <p class="source">${escapeMarkup(ref)} @ ${escapeMarkup(commit)}</p>
      <p class="source">${escapeMarkup(sourcePath)}</p>
      <p class="notice">這是 exact Git ref 的程式碼證據，不是 native runtime、Agent 或 Chrome Inspector 觀測。</p>
      <pre><code>${escapeMarkup(source)}</code></pre>
    </main>
  </body>
</html>`;
}

function escapeMarkup(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

async function addBrowserTestDoubleDisclosure(panel) {
  await panel.evaluate((element) => {
    const disclosure = document.createElement('p');
    disclosure.className = 'runtime-warning';
    disclosure.dataset.testid = 'browser-test-double-disclosure';
    disclosure.textContent = 'Browser test double 證據：不是 real Agent，也不是 native Chrome Inspector。';
    element.querySelector('h2')?.insertAdjacentElement('afterend', disclosure);
  });
}
