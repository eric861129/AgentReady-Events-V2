# Day 13-18 Search Events WebMCP Implementation Plan

> **For 黃祈豫:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to execute this plan step-by-step.

Goal: implement Day 13-18 on branch `work/day-13-to-day-18`, based on the already-approved design spec at `docs/superpowers/specs/2026-07-17-day-13-to-day-18-search-events-design.md`.

Scope:

- Add one real WebMCP tool named `search_events`.
- Use the native Chrome `document.modelContext` API only.
- Preserve Day 6-12 teaching labs (`search_events_lab`, `get_current_event_lab`) as labs, not production tools.
- Provide repeatable tests, deterministic app evidence panels, manual Chrome Inspector evidence templates, screenshots, and daily branch/tag refs for Day 13-18.
- Do not merge to `main` and do not push unless the user explicitly asks.

## Preconditions

- Work in `D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2\.worktrees\work-day-13-to-day-18`.
- Use safe Git config because this worktree can trigger Windows ownership checks:

```powershell
git -c safe.directory='D:/MySelf/iThome-2026/WebMCP/AgentReady-Events-V2/.worktrees/work-day-13-to-day-18' -C 'D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2\.worktrees\work-day-13-to-day-18' status --short
```

- Run npm commands with `npm.cmd` in PowerShell.
- Native WebMCP evidence requires Chrome with `chrome://flags/#enable-webmcp-testing` enabled and the official `WebMCP - Model Context Tool Inspector` installed. The user's Gemini API key is configured only in Chrome/Inspector, never in repo files or chat.

## Task 1: Establish The Pure Tool Contract For Day 13

Files:

- `src/domain/search-events-tool.ts`
- `tests/search-events-tool.test.ts`

Implementation:

1. Create `src/domain/search-events-tool.ts`.
2. Export these types:

```ts
import type { EventCategory, EventItem } from './events';

export type SearchEventsToolInput = {
  readonly query: string;
  readonly category?: EventCategory;
  readonly date?: string;
};

export type SearchEventsToolFailureCode =
  | 'INVALID_ARGUMENT'
  | 'NO_RESULTS'
  | 'TEMPORARY_UNAVAILABLE';

export type SearchEventsToolResultItem = {
  readonly eventId: string;
  readonly title: string;
  readonly category: EventCategory;
  readonly date: string;
  readonly location: string;
  readonly summary: string;
};

export type SearchEventsToolSuccess = {
  readonly status: 'ok';
  readonly appliedFilters: {
    readonly query: string;
    readonly category?: EventCategory;
    readonly date?: string;
  };
  readonly results: readonly SearchEventsToolResultItem[];
};

export type SearchEventsToolFailure = {
  readonly status: 'error';
  readonly errorCode: SearchEventsToolFailureCode;
  readonly message: string;
  readonly guidance: string;
};

export type SearchEventsToolResponse =
  | SearchEventsToolSuccess
  | SearchEventsToolFailure;

export type SearchEventsToolOptions = {
  readonly events?: readonly EventItem[];
  readonly isTemporarilyUnavailable?: () => boolean;
};
```

3. Export `searchEventsForTool(rawInput: unknown, options?: SearchEventsToolOptions): SearchEventsToolResponse`.
4. Validation rules:
   - `rawInput` must be a non-null object.
   - `query` is required, must be a string, and must be non-empty after `trim()`.
   - `category`, when present, must be one of `前端`, `後端`, `產品`, `社群`.
   - `date`, when present, must match `YYYY-MM-DD` and represent a real calendar date.
   - Invalid input returns:

```ts
{
  status: 'error',
  errorCode: 'INVALID_ARGUMENT',
  message: '搜尋活動需要有效的 query，category 必須是已知分類，date 必須是 YYYY-MM-DD。',
  guidance: '請提供非空白 query；category 可使用「前端、後端、產品、社群」；date 請使用像 2026-08-08 的格式。'
}
```

5. Temporary failure rule:
   - If `options?.isTemporarilyUnavailable?.()` returns `true`, return:

```ts
{
  status: 'error',
  errorCode: 'TEMPORARY_UNAVAILABLE',
  message: '活動搜尋目前暫時無法使用。',
  guidance: '請稍後再試，或移除受控測試情境後重新呼叫 search_events。'
}
```

6. Filtering rules:
   - Trim `query`.
   - Match `query` case-insensitively against `title`, `category`, `location`, and `summary`.
   - Apply `category` as exact category filter when provided.
   - Apply `date` as exact date filter when provided.
   - Map `EventItem.id` to output `eventId`.
   - Do not include detail URLs or fields outside the approved result shape.
7. No results returns:

```ts
{
  status: 'error',
  errorCode: 'NO_RESULTS',
  message: '找不到符合條件的活動。',
  guidance: '請放寬關鍵字、移除分類或日期限制後再試一次。'
}
```

Tests:

1. `tests/search-events-tool.test.ts` imports `searchEventsForTool`.
2. Add passing tests for:
   - query-only success with `query: '前端'`.
   - query plus `category: '前端'`.
   - query plus exact `date: '2026-08-08'`.
   - empty query returns `INVALID_ARGUMENT`.
   - unknown category returns `INVALID_ARGUMENT`.
   - invalid date format returns `INVALID_ARGUMENT`.
   - impossible date such as `2026-02-30` returns `INVALID_ARGUMENT`.
   - no matches returns `NO_RESULTS`.
   - `isTemporarilyUnavailable` returns `TEMPORARY_UNAVAILABLE`.
   - success output is JSON-serializable with only `status`, `appliedFilters`, and `results`.
3. Run:

```powershell
npm.cmd test -- tests/search-events-tool.test.ts
```

Commit checkpoint:

```powershell
git add src/domain/search-events-tool.ts tests/search-events-tool.test.ts
git commit -m "feat: define search events tool contract"
git branch -f day-13-search-events-contract
git tag -f v0.1.0-day-13
```

## Task 2: Add Native WebMCP Type Coverage

Files:

- `src/webmcp/types.ts`
- `tests/webmcp-support.test.ts`

Implementation:

1. Keep existing `ToolInputSchema`, `ModelContextTool`, `ExposedTool`, and `ModelContext` exports.
2. Update `ModelContext` to include `executeTool(name: string, input: Record<string, unknown>): Promise<unknown>`.
3. Keep `registerTool` and `getTools` signatures compatible with the Day 6-12 lab code.
4. Do not add `navigator.modelContext`.
5. Do not add a fallback or polyfill API.

Tests:

1. Update existing tests only if TypeScript requires mock objects to implement `executeTool`.
2. Run:

```powershell
npm.cmd test -- tests/webmcp-support.test.ts
```

## Task 3: Implement The `search_events` WebMCP Tool Factory For Day 14

Files:

- `src/webmcp/search-events-tool.ts`
- `tests/search-events-webmcp-tool.test.ts`

Implementation:

1. Create `src/webmcp/search-events-tool.ts`.
2. Export `SEARCH_EVENTS_TOOL_NAME = 'search_events'`.
3. Export `createSearchEventsTool(options?: SearchEventsToolOptions): ModelContextTool`.
4. Tool shape:

```ts
{
  name: SEARCH_EVENTS_TOOL_NAME,
  description: '搜尋公開活動清單，可依關鍵字、分類與日期找到適合推薦給使用者的活動。',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '使用者想尋找的活動關鍵字，例如「前端」、「API」或「社群」。'
      },
      category: {
        type: 'string',
        enum: ['前端', '後端', '產品', '社群'],
        description: '選填。限制活動分類。'
      },
      date: {
        type: 'string',
        description: '選填。限制活動日期，格式為 YYYY-MM-DD。'
      }
    },
    required: ['query']
  },
  annotations: {
    readOnlyHint: true
  },
  execute(input) {
    return JSON.stringify(searchEventsForTool(input, options));
  }
}
```

5. Keep the result as a JSON string so the article can show the raw Tool result directly.

Tests:

1. Tool name is exactly `search_events`.
2. `inputSchema.required` includes only `query`.
3. `annotations.readOnlyHint` is `true`.
4. `execute({ query: '前端' })` returns a parseable JSON string with `status: 'ok'`.
5. `execute({ query: '' })` returns a parseable JSON string with `status: 'error'` and `errorCode: 'INVALID_ARGUMENT'`.
6. Run:

```powershell
npm.cmd test -- tests/search-events-webmcp-tool.test.ts
```

## Task 4: Build Runtime Registration, Discovery, And Invocation Evidence

Files:

- `src/webmcp/search-events-runtime.ts`
- `tests/search-events-runtime.test.ts`

Implementation:

1. Create `src/webmcp/search-events-runtime.ts`.
2. Export:

```ts
export type SearchEventsRuntimeAvailability =
  | 'unsupported'
  | 'registered'
  | 'failed';

export type SearchEventsRuntimeSnapshot = {
  readonly availability: SearchEventsRuntimeAvailability;
  readonly nativeSupport: boolean;
  readonly registrationStatus: string;
  readonly discoveredTools: readonly ExposedTool[];
  readonly lastInvocation?: {
    readonly input: Record<string, unknown>;
    readonly rawResult: string;
  };
  readonly errorMessage?: string;
};
```

3. Export class `SearchEventsRuntime`.
4. Constructor accepts:

```ts
{
  readonly context: ModelContext | null;
  readonly toolOptions?: SearchEventsToolOptions;
}
```

5. `initialize(): Promise<SearchEventsRuntimeSnapshot>` behavior:
   - If `context` is `null`, return `unsupported`, `nativeSupport: false`, `registrationStatus: '此瀏覽器尚未提供 document.modelContext，無法註冊原生 WebMCP Tool。'`, `discoveredTools: []`.
   - If `context` exists, call `registerTool(createSearchEventsTool(toolOptions), { signal })`.
   - Then call `getTools()`.
   - Return `registered`, `nativeSupport: true`, `registrationStatus: '已透過 document.modelContext 註冊 search_events。'`, and discovered tools.
   - If registration or discovery throws, return `failed`, `nativeSupport: true`, `registrationStatus: 'WebMCP Tool 註冊或發現流程失敗。'`, `discoveredTools: []`, `errorMessage`.
6. Use an `AbortController` to cancel previous registration when `initialize()` is called multiple times.
7. `invokeForEvidence(input: Record<string, unknown>): Promise<SearchEventsRuntimeSnapshot>` behavior:
   - If unsupported, return current unsupported snapshot.
   - If supported, call `context.executeTool('search_events', input)`.
   - If result is not a string, stringify it with `JSON.stringify`.
   - Store `lastInvocation`.
   - Refresh discovered tools with `getTools()` after invocation when possible.
   - If invocation throws, return `failed` with `errorMessage`.
8. Do not simulate native support inside runtime code.

Tests:

1. Unsupported context returns honest unsupported snapshot.
2. Supported context registers `search_events` and calls `getTools`.
3. Runtime passes controlled temporary failure option into the registered tool.
4. `invokeForEvidence({ query: '前端' })` calls `executeTool('search_events', { query: '前端' })`.
5. Invocation stores raw JSON string.
6. Registration failure returns `failed` and preserves a readable error message.
7. Run:

```powershell
npm.cmd test -- tests/search-events-runtime.test.ts
```

Commit checkpoint:

```powershell
git add src/webmcp/types.ts src/webmcp/search-events-tool.ts src/webmcp/search-events-runtime.ts tests/webmcp-support.test.ts tests/search-events-webmcp-tool.test.ts tests/search-events-runtime.test.ts
git commit -m "feat: register native search events WebMCP tool"
git branch -f day-14-search-events-declaration
git tag -f v0.1.0-day-14
```

## Task 5: Add App Evidence Panel Without Replacing The Real Agent

Files:

- `src/main.ts`
- `src/styles.css`
- `tests/browser/webmcp-runtime.spec.ts`

Implementation:

1. In `src/main.ts`, import `SearchEventsRuntime`.
2. Add module state:

```ts
let searchEventsRuntimeSnapshot: SearchEventsRuntimeSnapshot | null = null;
const temporaryFailureEvidenceScenario =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('evidenceScenario') === 'temporary-unavailable';
```

3. Instantiate runtime with:

```ts
const searchEventsRuntime = new SearchEventsRuntime({
  context: getSupportedModelContext(document),
  toolOptions: {
    isTemporarilyUnavailable: () => temporaryFailureEvidenceScenario
  }
});
```

4. On startup, call `searchEventsRuntime.initialize()`, update snapshot state, and re-render.
5. Add a page section titled `原生 WebMCP 證據面板`.
6. This panel must display:
   - Native support: `document.modelContext 可用` or `document.modelContext 不可用`.
   - Registration status from runtime snapshot.
   - Discovered tools list, including `search_events` when native support or browser test double provides it.
   - Last invocation input and raw result when the direct evidence button has been clicked.
7. Add a direct evidence form with:
   - `data-testid="native-tool-query"` input defaulting to `前端`.
   - `data-testid="native-tool-invoke"` button text `用瀏覽器 API 驗證`.
   - Clear visible text `這是瀏覽器 API 驗證，不是 AI Agent 對話。`
8. On direct evidence submit, call `searchEventsRuntime.invokeForEvidence({ query })`, update snapshot, and re-render.
9. Keep the existing human activity search form and Day 11/12 lab panels working.
10. Add scoped CSS classes:
   - `.webmcp-runtime-panel`
   - `.runtime-status-grid`
   - `.runtime-evidence-log`
   - `.runtime-warning`
11. Do not add explanatory marketing text beyond what the existing page pattern already uses.

Browser tests:

1. `tests/browser/webmcp-runtime.spec.ts` uses Playwright.
2. Test unsupported regular browser:
   - Open `/`.
   - Expect `data-testid="webmcp-runtime-panel"` to show `document.modelContext 不可用`.
   - Expect no claim that `search_events` was natively registered.
3. Test supported browser behavior with test double:
   - Use `page.addInitScript` to define `document.modelContext` with `registerTool`, `getTools`, and `executeTool`.
   - The fake `getTools()` returns one exposed tool named `search_events`.
   - Open `/`.
   - Expect panel to show `search_events`.
   - Click direct evidence button.
   - Expect raw result log to contain `status` and `ok`.
4. Name the test file and test descriptions so they clearly say the injected context is a browser test double.
5. Run:

```powershell
npm.cmd run test:browser -- tests/browser/webmcp-runtime.spec.ts
```

Commit checkpoint:

```powershell
git add src/main.ts src/styles.css tests/browser/webmcp-runtime.spec.ts
git commit -m "feat: show search events WebMCP runtime evidence"
git branch -f day-15-agent-discovery
git tag -f v0.1.0-day-15
```

## Task 6: Prepare Manual Native Agent Evidence For Day 15

Files:

- `docs/evidence/day-15-agent-discovery.md`
- `docs/evidence/runtime-matrix-day-13-to-day-18.md`

Implementation:

1. Create `docs/evidence/day-15-agent-discovery.md`.
2. Include these sections:
   - `# Day 15 Agent Discovery Evidence`
   - `## Environment`
   - `## Prompt`
   - `## Expected Observation`
   - `## Actual Observation`
   - `## Screenshots`
   - `## Notes`
3. Environment checklist fields:
   - Branch: `day-15-agent-discovery`
   - Commit:
   - Chrome full version:
   - Chrome flag `#enable-webmcp-testing`: enabled
   - Inspector extension version:
   - Gemini model selected in Inspector:
   - Local URL:
4. Prompt must be exactly:

```text
請幫我找一場前端活動，告訴我日期與地點。
```

5. Add instruction that this prompt intentionally does not mention the Tool name, parameter names, or action verbs such as invoke/call.
6. Add expected observation:
   - Agent can discover `search_events`.
   - Agent selects it when the user's request is activity search.
   - If Gemini does not select the tool, record it as valid failure evidence and do not rewrite the prompt to force tool usage.
7. Create `docs/evidence/runtime-matrix-day-13-to-day-18.md` with rows:
   - Plain Playwright browser
   - Chrome with WebMCP flag disabled
   - Chrome with WebMCP flag enabled and Inspector installed
   - Chrome Inspector Gemini mode with user API key configured locally
8. Columns:
   - Runtime
   - Native support expected
   - Registration expected
   - Discovery expected
   - Invocation expected
   - Evidence file or screenshot

Verification:

```powershell
npm.cmd test
npm.cmd run typecheck
```

## Task 7: Wire Day 16 Invocation And Day 17 Result Evidence

Files:

- `docs/evidence/day-16-search-events-invocation.md`
- `docs/evidence/day-17-search-events-result.md`
- `tests/browser/webmcp-runtime.spec.ts`

Implementation:

1. Create `docs/evidence/day-16-search-events-invocation.md` with:
   - `# Day 16 Search Events Invocation Evidence`
   - Environment fields identical to Day 15.
   - Direct Inspector invocation input:

```json
{
  "query": "前端"
}
```

   - Expected raw result shape with `status`, `appliedFilters`, and `results`.
   - Actual raw result fields for manual capture.
   - Screenshot paths for manual capture:
     - `../WEBMCP-iThome-2026-Draft-V2/assets/day-16/inspector-invocation.png`
     - `../WEBMCP-iThome-2026-Draft-V2/assets/day-16/app-runtime-panel.png`
2. Create `docs/evidence/day-17-search-events-result.md` with:
   - `# Day 17 Search Events Result Evidence`
   - A field table documenting `eventId`, `title`, `category`, `date`, `location`, and `summary`.
   - A note that the response intentionally does not expose detail URL or mutation capability.
   - A manual result block where the captured JSON is pasted after native Inspector execution.
3. Extend `tests/browser/webmcp-runtime.spec.ts` if needed to assert the direct evidence output renders `eventId`, `title`, `date`, and `location`.

Verification:

```powershell
npm.cmd run test:browser -- tests/browser/webmcp-runtime.spec.ts
```

Commit checkpoint:

```powershell
git add docs/evidence/day-15-agent-discovery.md docs/evidence/runtime-matrix-day-13-to-day-18.md docs/evidence/day-16-search-events-invocation.md docs/evidence/day-17-search-events-result.md tests/browser/webmcp-runtime.spec.ts
git commit -m "docs: prepare search events discovery and invocation evidence"
git branch -f day-16-search-events-invocation
git tag -f v0.1.0-day-16
git branch -f day-17-search-events-result
git tag -f v0.1.0-day-17
```

## Task 8: Add Controlled Day 18 Error Evidence

Files:

- `docs/evidence/day-18-search-events-errors.md`
- `tests/search-events-tool.test.ts`
- `tests/browser/webmcp-runtime.spec.ts`

Implementation:

1. Create `docs/evidence/day-18-search-events-errors.md`.
2. Include sections:
   - `# Day 18 Error Handling Evidence`
   - `## INVALID_ARGUMENT`
   - `## NO_RESULTS`
   - `## TEMPORARY_UNAVAILABLE`
   - `## Why These Are Direct Inspector Calls`
3. Document direct Inspector invocation inputs:

```json
{
  "query": ""
}
```

```json
{
  "query": "不存在的活動"
}
```

```json
{
  "query": "前端"
}
```

4. Document that `TEMPORARY_UNAVAILABLE` must be captured from:

```text
http://127.0.0.1:4173/?evidenceScenario=temporary-unavailable
```

5. The document must call this a `受控暫時失敗` and must not describe it as a real production outage.
6. Ensure existing unit tests cover all three error codes.
7. Add or update browser test double coverage for the temporary failure query-string scenario:
   - Open `/?evidenceScenario=temporary-unavailable`.
   - Inject supported test double.
   - Click `用瀏覽器 API 驗證`.
   - Expect raw result to contain `TEMPORARY_UNAVAILABLE`.

Verification:

```powershell
npm.cmd test -- tests/search-events-tool.test.ts
npm.cmd run test:browser -- tests/browser/webmcp-runtime.spec.ts
```

Commit checkpoint:

```powershell
git add docs/evidence/day-18-search-events-errors.md tests/search-events-tool.test.ts tests/browser/webmcp-runtime.spec.ts
git commit -m "docs: capture search events error evidence"
git branch -f day-18-search-events-errors
git tag -f v0.1.0-day-18
```

## Task 9: Update Versioning And Screenshot Preparation

Files:

- `docs/versioning.md`
- `scripts/capture-article-screenshots.mjs`
- `WEBMCP-iThome-2026-Draft-V2/assets/README.md`

Implementation:

1. Update `docs/versioning.md` Day 13-18 rows to match the approved names:
   - Day 13: `day-13-search-events-contract`, `v0.1.0-day-13`
   - Day 14: `day-14-search-events-declaration`, `v0.1.0-day-14`
   - Day 15: `day-15-agent-discovery`, `v0.1.0-day-15`
   - Day 16: `day-16-search-events-invocation`, `v0.1.0-day-16`
   - Day 17: `day-17-search-events-result`, `v0.1.0-day-17`
   - Day 18: `day-18-search-events-errors`, `v0.1.0-day-18`
2. Update `scripts/capture-article-screenshots.mjs` to create these folders under the article assets root:
   - `day-13`
   - `day-14`
   - `day-15`
   - `day-16`
   - `day-17`
   - `day-18`
3. Add deterministic screenshots:
   - `day-13/search-events-human-baseline.png`: human UI search result for `前端`.
   - `day-14/search-events-tool-declaration.png`: render the `search_events` declaration source from the exact Day 14 reader ref `day-14-search-events-declaration`; the capture remains code evidence, not runtime or Agent evidence.
   - `day-15/runtime-test-double-discovery.png`: browser-test-double discovery screenshot, labeled in filename and nearby README as test-double evidence only.
   - `day-16/runtime-direct-invocation-test-double.png`: browser-test-double invocation screenshot, labeled as test-double evidence only.
   - `day-18/runtime-temporary-unavailable-test-double.png`: controlled failure screenshot, labeled as test-double evidence only.
4. Update `WEBMCP-iThome-2026-Draft-V2/assets/README.md` with Day 13-18 screenshot inventory and explicitly separate:
   - automated app screenshots,
   - browser test-double screenshots,
   - manual native Chrome Inspector screenshots.
5. Do not claim the automated test-double screenshots are real Agent screenshots.

Verification:

```powershell
npm.cmd run capture:articles
```

Commit checkpoint:

```powershell
git add docs/versioning.md scripts/capture-article-screenshots.mjs ..\WEBMCP-iThome-2026-Draft-V2\assets\README.md
git commit -m "docs: align Day 13 to Day 18 version and screenshot evidence"
```

## Task 10: Full Verification Gate

Run from the Day 13-18 worktree:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:browser
npm.cmd run capture:articles
```

If any command fails:

1. Read the failing assertion or TypeScript error.
2. Fix the narrowest implementation or test issue.
3. Re-run the failed command.
4. Re-run the full verification gate after the targeted failure is fixed.

## Task 11: Final Git Review

Commands:

```powershell
git -c safe.directory='D:/MySelf/iThome-2026/WebMCP/AgentReady-Events-V2/.worktrees/work-day-13-to-day-18' -C 'D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2\.worktrees\work-day-13-to-day-18' status --short
git -c safe.directory='D:/MySelf/iThome-2026/WebMCP/AgentReady-Events-V2/.worktrees/work-day-13-to-day-18' -C 'D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2\.worktrees\work-day-13-to-day-18' log --oneline --decorate -8
git -c safe.directory='D:/MySelf/iThome-2026/WebMCP/AgentReady-Events-V2/.worktrees/work-day-13-to-day-18' -C 'D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2\.worktrees\work-day-13-to-day-18' branch --list 'day-1*'
git -c safe.directory='D:/MySelf/iThome-2026/WebMCP/AgentReady-Events-V2/.worktrees/work-day-13-to-day-18' -C 'D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2\.worktrees\work-day-13-to-day-18' tag --list 'v0.1.0-day-1*'
```

Expected:

- Working tree is clean after all commits.
- Branches exist:
  - `day-13-search-events-contract`
  - `day-14-search-events-declaration`
  - `day-15-agent-discovery`
  - `day-16-search-events-invocation`
  - `day-17-search-events-result`
  - `day-18-search-events-errors`
- Tags exist:
  - `v0.1.0-day-13`
  - `v0.1.0-day-14`
  - `v0.1.0-day-15`
  - `v0.1.0-day-16`
  - `v0.1.0-day-17`
  - `v0.1.0-day-18`
- `main` is not merged or changed by this plan.

## Task 12: Manual Native Chrome Evidence Handoff

After implementation and local verification, ask the user to perform or approve the native Chrome evidence capture:

1. Open Chrome with `chrome://flags/#enable-webmcp-testing` enabled.
2. Open the local app URL.
3. Open the official Model Context Tool Inspector.
4. Configure Gemini API key locally inside the browser/extension.
5. Capture Day 15 prompt-based discovery using:

```text
請幫我找一場前端活動，告訴我日期與地點。
```

6. Capture Day 16 direct invocation with `{ "query": "前端" }`.
7. Capture Day 17 raw result JSON.
8. Capture Day 18 error cases with direct Inspector calls.
9. Store screenshots under:
   - `D:\MySelf\iThome-2026\WebMCP\WEBMCP-iThome-2026-Draft-V2\assets\day-15`
   - `D:\MySelf\iThome-2026\WebMCP\WEBMCP-iThome-2026-Draft-V2\assets\day-16`
   - `D:\MySelf\iThome-2026\WebMCP\WEBMCP-iThome-2026-Draft-V2\assets\day-17`
   - `D:\MySelf\iThome-2026\WebMCP\WEBMCP-iThome-2026-Draft-V2\assets\day-18`
10. Fill the actual observation fields in the evidence markdown files.

## Completion Criteria

- Day 13-18 source, tests, docs, screenshot automation, branch refs, and tags exist.
- Native Tool implementation uses `document.modelContext` only.
- The app honestly distinguishes:
  - unsupported browser,
  - browser API direct verification,
  - browser test-double screenshots,
  - real Agent/Inspector evidence.
- `search_events` returns parseable JSON with the approved success and error shapes.
- `INVALID_ARGUMENT`, `NO_RESULTS`, and `TEMPORARY_UNAVAILABLE` are covered by unit tests and evidence docs.
- Full verification gate passes or any remaining blocker is reported with exact command output.
