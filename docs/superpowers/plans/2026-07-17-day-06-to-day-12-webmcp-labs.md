# Day 6–12 WebMCP Labs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 Day 6–12 的概念材料、Declarative Lab 與 Imperative Lab，並產生可重現的測試、截圖與每日讀者快照。

**Architecture:** 文章概念材料維持在 `docs/`，互動 Lab 加入既有單頁活動網站。`document.modelContext` 存在時才使用真實 WebMCP API；其他瀏覽器只顯示誠實標示的結構預覽或不支援狀態。每個 Day commit 完成後，建立不可修改的讀者 branch 與 tag。

**Tech Stack:** TypeScript、Vite、Vitest、Playwright、WebMCP Draft API。

## Global Constraints

- 使用 `document.modelContext`，不使用已淘汰的 `navigator.modelContext`。
- Day 11 工具名稱固定為 `search_events_lab`；Day 13 前不得註冊正式 `search_events`。
- 不將 preview、mock 或測試 double 描述為真實 Agent discovery 或 invocation。
- 不進行報名、付款或其他高風險寫入；Day 12 工具只讀取目前活動資料。
- 每一項新行為先寫測試、確認 RED，再寫最小實作。

---

### Task 1: Day 6–10 的文章證據材料

**Files:**
- Create: `docs/day-06-webmcp-concept.md`
- Create: `docs/day-07-technology-boundaries.md`
- Create: `docs/day-08-tool-contract.md`
- Create: `docs/day-09-tool-selection.md`
- Create: `docs/day-10-api-strategy.md`
- Modify: `src/main.ts`
- Test: `tests/browser/webmcp-labs.spec.ts`

**Interfaces:**
- Produces: `data-testid="webmcp-concept-card"`，供 Day 6 截圖與 Browser test 使用。

- [ ] **Step 1: Write the failing browser test**

```ts
test('網站以概念卡對比人類搜尋介面與結構化能力描述', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('webmcp-concept-card')).toContainText('search_events');
  await expect(page.getByTestId('webmcp-concept-card')).toContainText('這不是正式 Tool 註冊');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec playwright test tests/browser/webmcp-labs.spec.ts --grep "概念卡"`

Expected: FAIL because `webmcp-concept-card` does not exist.

- [ ] **Step 3: Write minimal implementation and Markdown evidence**

Render a `webmcp-concept-card` that contrasts the existing search form with the Day 8 draft contract and explicitly says it is not a registration. Write the five focused Markdown documents: boundaries table, draft contract, candidate selection matrix, and Declarative/Imperative decision table.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec playwright test tests/browser/webmcp-labs.spec.ts --grep "概念卡"`

Expected: 1 passed.

- [ ] **Step 5: Commit and snapshot**

Create one documentation commit per Day 6–10 and create `day-06-webmcp-concept` through `day-10-api-strategy` plus their `v0.1.0-day-XX` tags.

### Task 2: Declarative Lab contract preview

**Files:**
- Create: `src/labs/declarative-preview.ts`
- Test: `tests/declarative-preview.test.ts`

**Interfaces:**
- Produces: `readDeclarativeFormPreview(form: HTMLFormElement): DeclarativeToolPreview`.
- Consumes: a `<form>` with `toolname`, `tooldescription` and named fields.

- [ ] **Step 1: Write the failing unit tests**

```ts
expect(createDeclarativeToolPreview({
  toolname: 'search_events_lab',
  tooldescription: '依關鍵字尋找公開活動。',
  fields: [{ name: 'query', type: 'search', description: '活動關鍵字。', required: true }]
})).toEqual({
  name: 'search_events_lab',
  description: '依關鍵字尋找公開活動。',
  inputSchema: { type: 'object', properties: { query: { type: 'string', description: '活動關鍵字。' } }, required: ['query'] }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests/declarative-preview.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement the preview type and pure converter. Mark its rendered label as `教學結構預覽（非 Agent discovery）`; it must not call a tool.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- tests/declarative-preview.test.ts`

Expected: all declarative preview tests pass.

### Task 3: Day 11 annotated form and browser evidence

**Files:**
- Modify: `src/main.ts`
- Modify: `src/styles.css`
- Create: `docs/day-11-declarative-lab.md`
- Modify: `tests/browser/webmcp-labs.spec.ts`

**Interfaces:**
- Produces: form `#declarative-search-lab` with `toolname="search_events_lab"` and `tooldescription`.
- Produces: `data-testid="declarative-preview"`.

- [ ] **Step 1: Write the failing browser test**

```ts
test('宣告式 Lab 顯示標註表單與非 Agent 的結構預覽', async ({ page }) => {
  await page.goto('/');
  const form = page.locator('#declarative-search-lab');
  await expect(form).toHaveAttribute('toolname', 'search_events_lab');
  await expect(form.getByLabel('活動關鍵字')).toHaveAttribute('toolparamdescription', '用於比對公開活動的關鍵字。');
  await expect(page.getByTestId('declarative-preview')).toContainText('教學結構預覽');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec playwright test tests/browser/webmcp-labs.spec.ts --grep "宣告式 Lab"`

Expected: FAIL because the annotated Lab is absent.

- [ ] **Step 3: Write minimal implementation**

Add an independent Lab section without changing the existing human search form or its Day 5 button-copy experiment. Render the JSON preview from `createDeclarativeToolPreview`.

- [ ] **Step 4: Run tests to verify it passes**

Run: `npm.cmd test; npm.cmd exec playwright test tests/browser/webmcp-labs.spec.ts --grep "宣告式 Lab"`

Expected: unit tests and the focused browser test pass.

- [ ] **Step 5: Commit and snapshot**

Commit Day 11, then create `day-11-declarative-lab` and `v0.1.0-day-11`.

### Task 4: WebMCP capability and real-tool reader

**Files:**
- Create: `src/webmcp/types.ts`
- Create: `src/webmcp/support.ts`
- Test: `tests/webmcp-support.test.ts`

**Interfaces:**
- Produces: `getSupportedModelContext(document): ModelContext | null`.
- Produces: `readCurrentTools(context): Promise<readonly ExposedTool[]>`.

- [ ] **Step 1: Write failing unit tests**

```ts
expect(getSupportedModelContext({ modelContext: context } as Document)).toBe(context);
expect(getSupportedModelContext({} as Document)).toBeNull();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests/webmcp-support.test.ts`

Expected: FAIL because `webmcp/support` does not exist.

- [ ] **Step 3: Write minimal implementation**

Declare only the draft methods used by the Labs: `registerTool`, `getTools`, and tool metadata. Do not add a polyfill or a fallback runtime.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- tests/webmcp-support.test.ts`

Expected: support tests pass.

### Task 5: Imperative current-event lifecycle

**Files:**
- Create: `src/labs/current-event-tool.ts`
- Test: `tests/current-event-tool.test.ts`

**Interfaces:**
- Produces: `CurrentEventToolLifecycle.sync(event: EventItem | null): Promise<void>`.
- Consumes: `ModelContext | null` and an `EventItem`.
- Registers: `get_current_event_lab` only while an event is selected.

- [ ] **Step 1: Write failing unit tests**

```ts
await lifecycle.sync(event);
expect(registerTool).toHaveBeenCalledWith(expect.objectContaining({ name: 'get_current_event_lab' }), expect.objectContaining({ signal: expect.any(AbortSignal) }));
await lifecycle.sync(null);
expect(signal.aborted).toBe(true);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests/current-event-tool.test.ts`

Expected: FAIL because the lifecycle module does not exist.

- [ ] **Step 3: Write minimal implementation**

When the context is unavailable, do nothing. When an event is selected, abort any prior registration, register `get_current_event_lab`, and return a read-only event summary. When no event is selected, abort the current signal.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- tests/current-event-tool.test.ts`

Expected: lifecycle tests pass.

### Task 6: Day 12 interface and browser evidence

**Files:**
- Modify: `src/main.ts`
- Modify: `src/styles.css`
- Create: `docs/day-12-imperative-lab.md`
- Modify: `tests/browser/webmcp-labs.spec.ts`

**Interfaces:**
- Produces: `data-testid="imperative-lab-status"`.
- Produces: truthful status text for supported and unsupported browser cases.

- [ ] **Step 1: Write failing browser test**

```ts
test('不支援 WebMCP 的瀏覽器不會把詳情對話框說成已註冊 Tool', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '查看詳情' }).click();
  await expect(page.getByTestId('imperative-lab-status')).toContainText('未提供 WebMCP');
  await expect(page.getByTestId('imperative-lab-status')).not.toContainText('已向 Agent 註冊');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec playwright test tests/browser/webmcp-labs.spec.ts --grep "不支援 WebMCP"`

Expected: FAIL because there is no imperative status panel.

- [ ] **Step 3: Write minimal implementation**

Synchronize `CurrentEventToolLifecycle` after every render. In a supported browser, read `getTools()` and show real tool names. In unsupported browsers, render only the capability warning and explain that no Agent discovery or invocation occurred.

- [ ] **Step 4: Run tests to verify it passes**

Run: `npm.cmd test; npm.cmd exec playwright test tests/browser/webmcp-labs.spec.ts --grep "不支援 WebMCP"`

Expected: all unit tests and focused browser test pass.

- [ ] **Step 5: Commit and snapshot**

Commit Day 12, then create `day-12-imperative-lab` and `v0.1.0-day-12`.

### Task 7: Screenshot capture, version index and final verification

**Files:**
- Modify: `scripts/capture-article-screenshots.mjs`
- Modify: `docs/versioning.md`
- Modify: `../WEBMCP-iThome-2026-Draft-V2/assets/README.md`
- Create: `../WEBMCP-iThome-2026-Draft-V2/assets/day-06/webmcp-concept.png`
- Create: `../WEBMCP-iThome-2026-Draft-V2/assets/day-11/declarative-lab.png`
- Create: `../WEBMCP-iThome-2026-Draft-V2/assets/day-12/imperative-lab-unsupported-browser.png`

**Interfaces:**
- Consumes: the running Vite app and its stable `data-testid` attributes.
- Produces: article-ready evidence with branch and commit references in the asset manifest.

- [ ] **Step 1: Update screenshot script for `開始搜尋` and three new captures**

Use stable test IDs; for Day 12 intentionally capture the actual unsupported-browser warning when `document.modelContext` is missing.

- [ ] **Step 2: Generate and visually inspect assets**

Run: `npm.cmd run capture:articles` against a controlled Vite server.

Expected: three new PNG files exist and display the expected demo state.

- [ ] **Step 3: Run complete verification**

Run: `npm.cmd test; npm.cmd run typecheck; npm.cmd run build; npm.cmd run test:browser` with a controlled Vite server.

Expected: all standard tests pass; Day 5's separate `test:browser:button-copy` remains an intentionally failing experiment and is not part of this command.

- [ ] **Step 4: Create Day 6–12 snapshots**

After each day-specific commit, create the corresponding immutable reader branch and `v0.1.0-day-XX` tag. Update the version table to `已建立` only after the ref exists.
