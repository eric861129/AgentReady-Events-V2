# Day 27 Test Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide one reproducible Day 27 command that verifies the minimum WebMCP contract, lifecycle, journey, and server-trust boundary without claiming native Agent proof.

**Architecture:** Keep production behavior unchanged. `package.json` will group existing focused Vitest and Playwright files into named layers and one `test:day-27` entry point. `docs/evidence/day-27-test-strategy.md` will map every requirement to a concrete test and state the evidence boundary of browser test doubles.

**Tech Stack:** Node.js 22, npm scripts, Vitest, Playwright, TypeScript, Markdown.

## Global Constraints

- Do not add, rename, or change any WebMCP Tool, Tool description, or catalog fixture.
- `test:day-27` must run only the listed focused Day 27 checks, not the entire suite.
- Browser test-double results are contract and page-integration evidence, not native Chrome or Agent discovery evidence.
- Preserve the Day 27 working commit on `feature/day-27-to-day-28-verification-comparison`; create the immutable reader ref only after all gates pass.
- Do not push any branch or tag in this task.

---

### Task 1: Add the focused Day 27 npm test entry points

**Files:**
- Modify: `package.json`
- Test: `npm run test:day-27`

**Interfaces:**
- Consumes: existing Vitest and Playwright test files.
- Produces: `test:day-27:contract`, `test:day-27:lifecycle`, `test:day-27:journey`, `test:day-27:boundary`, `test:day-27:browser`, and `test:day-27` npm scripts.

- [x] **Step 1: Confirm the aggregate command does not exist yet**

Run: `npm run test:day-27`

Expected: npm exits non-zero and reports `Missing script: "test:day-27"`.

- [x] **Step 2: Add the layered scripts to `package.json`**

Add this exact script block after `test:browser:button-copy`:

```json
"test:day-27:contract": "vitest run tests/search-events-webmcp-tool.test.ts tests/search-events-tool.test.ts",
"test:day-27:lifecycle": "vitest run tests/webmcp/current-event-tool-lifecycle.test.ts tests/application/save-event.test.ts",
"test:day-27:journey": "vitest run tests/integration/day-25-agent-journey.test.ts",
"test:day-27:boundary": "vitest run tests/server/demo-api.test.ts",
"test:day-27:browser": "playwright test tests/browser/webmcp-runtime.spec.ts tests/browser/day-24-tool-lifecycle.spec.ts tests/browser/day-25-agent-journey.spec.ts tests/browser/day-26-trusted-boundary.spec.ts",
"test:day-27": "npm run test:day-27:contract && npm run test:day-27:lifecycle && npm run test:day-27:journey && npm run test:day-27:boundary && npm run test:day-27:browser"
```

- [x] **Step 3: Run each focused layer once**

Run:

```powershell
npm run test:day-27:contract
npm run test:day-27:lifecycle
npm run test:day-27:journey
npm run test:day-27:boundary
npm run test:day-27:browser
```

Expected: every command exits 0; record the actual test counts in the Day 27 evidence document.

- [x] **Step 4: Run the aggregate command**

Run: `npm run test:day-27`

Expected: every layer runs in the defined order and npm exits 0.

### Task 2: Publish the test matrix and evidence boundary

**Files:**
- Create: `docs/evidence/day-27-test-strategy.md`
- Test: compare the table with every script introduced in Task 1.

**Interfaces:**
- Consumes: the six npm scripts from Task 1 and the current focused test output.
- Produces: a reader-facing Day 27 matrix linking each risk to exact test files, commands, observed count, and claim boundary.

- [x] **Step 1: Write the matrix before recording results**

Create a Markdown table with these exact rows:

| Layer | Command | Test files | Required assertion | Evidence boundary |
| --- | --- | --- | --- | --- |
| Tool contract | `npm run test:day-27:contract` | `tests/search-events-webmcp-tool.test.ts`, `tests/search-events-tool.test.ts` | `search_events` success output and named error output stay stable. | Tool unit contract; not Agent discovery. |
| Lifecycle | `npm run test:day-27:lifecycle` | `tests/webmcp/current-event-tool-lifecycle.test.ts`, `tests/application/save-event.test.ts` | stale Tool and mismatched route return `ROUTE_MISMATCH` before a write request. | Unit/application behavior; not server authorization. |
| Journey | `npm run test:day-27:journey` | `tests/integration/day-25-agent-journey.test.ts` | search, `detailUrl` navigation, details, and save stop on an invalid step. | Adapter fake test double; not Agent planning. |
| Server boundary | `npm run test:day-27:boundary` | `tests/server/demo-api.test.ts` | missing session, forged `userId`, and unknown event are rejected without mutating saved state. | Demo API contract; not production security audit. |
| Browser integration | `npm run test:day-27:browser` | `tests/browser/webmcp-runtime.spec.ts`, `tests/browser/day-24-tool-lifecycle.spec.ts`, `tests/browser/day-25-agent-journey.spec.ts`, `tests/browser/day-26-trusted-boundary.spec.ts` | page registration, lifecycle, journey, and server-state UI evidence stay connected. | browser test double where installed; never native Agent proof. |

- [x] **Step 2: Add the required non-claims and scope statement**

Write these statements verbatim in the document:

```text
Day 27 是一組最小回歸門檻，不是以測試數量為目標的全量測試宣告。
測試主動注入 document.modelContext 的案例，只能證明 adapter 與頁面 contract；不能寫成原生 Chrome、Inspector 或真實 Agent 已發現並呼叫 Tool。
Day 26 的 browser test 使用真實 Demo API，但仍不是 production security audit。
```

- [x] **Step 3: Record actual aggregate output**

After Task 1 succeeds, append the date, each layer's test count, and `npm run test:day-27` exit code 0. Do not invent counts before running the command.

- [x] **Step 4: Review matrix coverage**

Verify the document has one row each for contract, lifecycle, journey, server boundary, and browser integration; verify the `document.modelContext` limitation appears in both the matrix and the non-claims section.

### Task 3: Run the complete repository gate and create the Day 27 reader snapshot

**Files:**
- Modify: `package.json`
- Create: `docs/evidence/day-27-test-strategy.md`
- Create Git refs: `day-27-test-strategy`, `v0.1.0-day-27`

**Interfaces:**
- Consumes: all Task 1 scripts and the evidence document from Task 2.
- Produces: one reviewed Day 27 commit, an immutable reader branch, and an annotated reader tag on the same commit.

- [x] **Step 1: Run the complete quality gate**

Run:

```powershell
npm run test:day-27
npm test
npm run test:browser
npm run typecheck
npm run build
```

Expected: every command exits 0. If a command fails, stop and correct the focused configuration or evidence documentation before creating any reader ref.

- [x] **Step 2: Review the staged diff**

Run:

```powershell
git diff --check
git status --short
git diff -- package.json docs/evidence/day-27-test-strategy.md
```

Expected: only `package.json` and `docs/evidence/day-27-test-strategy.md` are changed; no whitespace errors.

- [x] **Step 3: Commit the Day 27 implementation**

Run:

```powershell
git add package.json docs/evidence/day-27-test-strategy.md
git commit -m "test(day27): add repeatable WebMCP verification matrix"
```

Expected: the commit contains only the Day 27 scripts and evidence matrix.

- [x] **Step 4: Create and verify immutable reader refs**

Run:

```powershell
git branch day-27-test-strategy HEAD
git tag -a v0.1.0-day-27 -m "release: Day 27 test strategy snapshot"
git rev-parse day-27-test-strategy
git rev-parse "v0.1.0-day-27^{}"
```

Expected: the branch SHA and peeled annotated-tag SHA are identical to the committed Day 27 HEAD.
