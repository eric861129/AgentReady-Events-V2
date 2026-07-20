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
const canonicalEventId = 'event-frontend-summit';
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
  'day-18',
  'day-24',
  'day-25',
  'day-26'
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

  await page.getByRole('link', { name: '查看詳情' }).click();
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

  const day24Page = await browser.newPage(pageOptions);
  await installRegisteredToolBrowserTestDouble(day24Page);
  await day24Page.goto(baseURL, { waitUntil: 'networkidle' });
  await waitForRegisteredTools(day24Page, ['search_events']);
  const day24SearchResult = await executeRegisteredTool(day24Page, 'search_events', {
    query: '前端'
  });
  const day24DetailUrl = readCanonicalDetailUrl(day24SearchResult);
  await day24Page.goto(day24DetailUrl, { waitUntil: 'networkidle' });
  await day24Page.getByRole('dialog', { name: '前端體驗設計小聚' }).waitFor();
  const day24DetailTools = await waitForRegisteredTools(day24Page, [
    'get_event_details',
    'save_event'
  ]);
  await addCaptureEvidence(day24Page, {
    title: 'Day 24｜detailUrl 與 route-aware Tool',
    boundary: 'Browser test double 截圖：不是原生 Chrome Agent discovery，也不是 Inspector 證據。',
    items: [
      ['search_events.detailUrl', day24DetailUrl],
      ['一般瀏覽器導覽後 route', day24Page.url()],
      ['此 route 可用 Tool', day24DetailTools.join('、')]
    ]
  });
  await day24Page.getByRole('dialog', { name: '前端體驗設計小聚' }).screenshot({
    path: path.join(assetDirectory, 'day-24', 'route-aware-tools-browser-test-double.png')
  });

  const day25Page = await browser.newPage(pageOptions);
  await installRegisteredToolBrowserTestDouble(day25Page);
  await day25Page.goto(baseURL, { waitUntil: 'networkidle' });
  await removeSavedEvent(day25Page, canonicalEventId);
  await day25Page.reload({ waitUntil: 'networkidle' });
  await waitForRegisteredTools(day25Page, ['search_events']);
  const day25SearchResult = await executeRegisteredTool(day25Page, 'search_events', {
    query: '前端'
  });
  const day25DetailUrl = readCanonicalDetailUrl(day25SearchResult);
  await day25Page.goto(day25DetailUrl, { waitUntil: 'networkidle' });
  await waitForRegisteredTools(day25Page, ['get_event_details', 'save_event']);
  const day25DetailResult = await executeRegisteredTool(day25Page, 'get_event_details', {
    eventId: canonicalEventId
  });
  const day25SaveResult = await executeRegisteredTool(day25Page, 'save_event', {
    eventId: canonicalEventId
  });
  await day25Page.getByTestId('event-detail-saved-state').filter({
    hasText: '收藏狀態：已收藏'
  }).waitFor();
  await addCaptureEvidence(day25Page, {
    title: 'Day 25｜完整 Agent journey browser test double',
    boundary: 'Browser test double 截圖：不是原生 Chrome Inspector、真實 Agent discovery 或 Agent 自主規劃。',
    items: [
      ['1. search_events', `query=前端 → ${day25SearchResult.results?.[0]?.eventId ?? '無結果'}`],
      ['2. detailUrl 導覽', day25DetailUrl],
      ['3. get_event_details', `${day25DetailResult.status ?? 'unknown'} → ${day25DetailResult.event?.title ?? '無活動'}`],
      ['4. save_event', JSON.stringify(day25SaveResult)]
    ]
  });
  await day25Page.getByRole('dialog', { name: '前端體驗設計小聚' }).screenshot({
    path: path.join(assetDirectory, 'day-25', 'agent-journey-browser-test-double.png')
  });

  const day26Page = await browser.newPage(pageOptions);
  const day26DetailUrl = new URL(`/?event=${canonicalEventId}`, baseURL).href;
  await day26Page.goto(day26DetailUrl, { waitUntil: 'networkidle' });
  await removeSavedEvent(day26Page, canonicalEventId);
  await day26Page.reload({ waitUntil: 'networkidle' });
  const saveButton = day26Page.getByTestId('event-detail-saved-state')
    .getByRole('button', { name: '收藏活動' });
  await saveButton.waitFor();
  const [saveResponse] = await Promise.all([
    day26Page.waitForResponse((response) => (
      response.request().method() === 'PUT'
      && response.url().endsWith(`/api/saved-events/${canonicalEventId}`)
    )),
    saveButton.click()
  ]);
  const saveResponseBody = await saveResponse.json();
  await day26Page.getByTestId('event-detail-saved-state').filter({
    hasText: '收藏狀態：已收藏'
  }).waitFor();
  const savedEventsResponse = await readSavedEvents(day26Page);
  const demoSessionCookie = (await day26Page.context().cookies(baseURL)).find((cookie) => (
    cookie.name === 'demo_session'
  ));

  if (
    saveResponse.status() !== 200
    || saveResponseBody.status !== 'ok'
    || !savedEventsResponse.eventIds.includes(canonicalEventId)
    || demoSessionCookie?.httpOnly !== true
  ) {
    throw new Error('Day 26 Demo API session 未形成可截圖的 server source-of-truth 證據。');
  }

  await addCaptureEvidence(day26Page, {
    title: 'Day 26｜Demo API session 與 server source of truth',
    boundary: '真實 Demo API UI 證據：不是原生 Agent 證據，也不是 production security audit。',
    items: [
      ['UI 收藏狀態', 'server 回傳後顯示「已收藏」'],
      ['Demo API PUT', `${saveResponse.status()} ${JSON.stringify(saveResponseBody)}`],
      ['Server GET', JSON.stringify(savedEventsResponse)],
      ['Demo session', 'demo-reader；demo_session（HttpOnly cookie）；in-memory state']
    ]
  });
  await day26Page.getByRole('dialog', { name: '前端體驗設計小聚' }).screenshot({
    path: path.join(assetDirectory, 'day-26', 'demo-api-session-saved-state.png')
  });

  console.log(`Article screenshots saved to ${assetDirectory}`);
} finally {
  await browser.close();
}

async function installRegisteredToolBrowserTestDouble(targetPage) {
  await targetPage.addInitScript(() => {
    const registrations = [];

    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        async registerTool(tool, options) {
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
        async executeTool(tool, inputJson) {
          const registration = registrations.find((candidate) => (
            !candidate.signal?.aborted && candidate.tool.name === tool.name
          ));

          if (registration === undefined) {
            throw new Error(`Browser test double 找不到已註冊的 Tool：${tool.name}`);
          }

          return registration.tool.execute(JSON.parse(inputJson));
        }
      }
    });
  });
}

async function waitForRegisteredTools(targetPage, expectedNames) {
  await targetPage.waitForFunction(async (names) => {
    const context = document.modelContext;

    if (context === undefined) {
      return false;
    }

    const tools = await context.getTools();
    return JSON.stringify(tools.map((tool) => tool.name)) === JSON.stringify(names);
  }, expectedNames);

  return targetPage.evaluate(async () => (
    (await document.modelContext.getTools()).map((tool) => tool.name)
  ));
}

async function executeRegisteredTool(targetPage, toolName, input) {
  return targetPage.evaluate(async ({ name, rawInput }) => {
    const context = document.modelContext;
    const tool = (await context.getTools()).find((candidate) => candidate.name === name);

    if (tool === undefined) {
      throw new Error(`Browser test double 找不到 Tool：${name}`);
    }

    const rawResult = await context.executeTool(tool, JSON.stringify(rawInput));
    return typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
  }, { name: toolName, rawInput: input });
}

function readCanonicalDetailUrl(searchResult) {
  const detailUrl = searchResult.results?.[0]?.detailUrl;
  const expectedPath = `/?event=${canonicalEventId}`;

  if (typeof detailUrl !== 'string' || new URL(detailUrl).pathname + new URL(detailUrl).search !== expectedPath) {
    throw new Error(`search_events 未回傳正式活動的 detailUrl：${String(detailUrl)}`);
  }

  return detailUrl;
}

async function removeSavedEvent(targetPage, eventId) {
  const result = await targetPage.evaluate(async (targetEventId) => {
    const response = await fetch(`/api/saved-events/${encodeURIComponent(targetEventId)}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });

    return { status: response.status, body: await response.json() };
  }, eventId);

  if (result.status !== 200 || result.body.status !== 'ok') {
    throw new Error(`無法重設 ${eventId} 的 Demo API 收藏狀態。`);
  }
}

async function readSavedEvents(targetPage) {
  const result = await targetPage.evaluate(async () => {
    const response = await fetch('/api/saved-events', {
      method: 'GET',
      credentials: 'same-origin'
    });

    return { status: response.status, body: await response.json() };
  });

  if (result.status !== 200 || result.body.status !== 'ok' || !Array.isArray(result.body.eventIds)) {
    throw new Error('無法讀取 Demo API session 的收藏清單。');
  }

  return result.body;
}

async function addCaptureEvidence(targetPage, evidence) {
  await targetPage.evaluate(({ title, boundary, items }) => {
    const dialog = document.querySelector('[role="dialog"]');

    if (!(dialog instanceof HTMLElement)) {
      throw new Error('找不到文章截圖所需的活動詳情 dialog。');
    }

    const style = document.createElement('style');
    style.dataset.captureEvidence = 'true';
    style.textContent = `
      .event-dialog { width: min(1040px, calc(100vw - 64px)) !important; max-width: 1040px !important; }
      .capture-evidence { margin-top: 24px; padding: 20px 22px; border: 2px solid #315ac7; border-radius: 14px; background: #f4f7fc; }
      .capture-evidence h3 { margin: 0 0 10px; color: #17213a; font-size: 22px; }
      .capture-evidence__boundary { margin: 0 0 14px; padding: 10px 12px; border-radius: 8px; color: #7a3f00; background: #fff1d6; font-weight: 700; }
      .capture-evidence dl { display: grid; grid-template-columns: 210px 1fr; gap: 8px 16px; margin: 0; }
      .capture-evidence dt { font-weight: 700; }
      .capture-evidence dd { margin: 0; font-family: Consolas, "Microsoft JhengHei", monospace; overflow-wrap: anywhere; white-space: pre-wrap; }
    `;
    document.head.append(style);

    const panel = document.createElement('section');
    panel.className = 'capture-evidence';
    panel.dataset.testid = 'article-capture-evidence';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const disclosure = document.createElement('p');
    disclosure.className = 'capture-evidence__boundary';
    disclosure.textContent = boundary;
    const list = document.createElement('dl');

    for (const [label, value] of items) {
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value;
      list.append(term, description);
    }

    panel.append(heading, disclosure, list);
    dialog.append(panel);
  }, evidence);
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
