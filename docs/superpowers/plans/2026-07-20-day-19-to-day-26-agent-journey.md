# Day 19–26 Agent Journey 與可信任 Demo API 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 從 `v0.1.0-day-18` 建立一條可重現的「搜尋活動 → 一般瀏覽器導覽詳情頁 → 讀取詳情 → 收藏」Agent Journey；搜尋結果在 Day 24 正式加入 `detailUrl`，並以最小、可測試的同源 Demo API 與測試 session 讓 `save_event` 的寫入不再只停留在前端記憶體。

**Architecture:** 保留 Vite 單頁網站與既有活動目錄作為 UI；新增 Node `http` 的本機 Demo API，使用不透明且 HttpOnly 的測試 session cookie 推導目前 principal。前端與 WebMCP Tool 都透過同一個 client use case 呼叫 API；路由狀態決定當下可宣告的 Tool。Day 17、18 已發布快照維持原樣，`detailUrl` 是 Day 24 的向前相容契約擴充，而不是回頭重寫歷史。

**Tech Stack:** Node.js 22、TypeScript、Vite、Vitest、Playwright、原生 `node:http`、`tsx`、`concurrently`、Chrome WebMCP 實驗性 API adapter。

## Global Constraints

- 所有後半段開發都必須從 `v0.1.0-day-18`（SHA `615ee1c`）建立功能分支；不得從 `main`（SHA `8d12bed`）開始，也不得移動 Day 1–18 的 branch 或 tag。
- 建議在獨立 worktree `D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-day19-26` 工作；只在驗證與審查完成後，才決定要不要整合回 `main`。本計畫不授權 push 或 merge。
- 每一日 branch/tag 都只能包含該日以前的內容。建立日快照後，必須以全新 clone 實際執行 build 與 smoke test；不得讓所有日 ref 指向最新 HEAD。
- `document.modelContext` 的 browser test double 只能證明 adapter、呼叫序列與 UI 行為，證據標籤必須清楚寫為「browser test double」。只有真實 Chrome Inspector／Agent 環境的紀錄才能稱為原生證據；不支援時要保留版本、旗標與不支援畫面。
- Demo API 是本機教學用可信任邊界：session 與收藏資料都在 process 記憶體，重啟即清除；它不是帳號系統、OAuth、RBAC、持久化資料庫或企業級安全聲明。
- `save_event` 只做「加入收藏」，必須冪等；取消收藏只由人類 UI 的刪除操作完成，不另增 Agent Tool。不得在這個階段加入報名、付款、通知或第四個 Tool。
- 所有錯誤回應沿用結構化 `errorCode`。前端不得接受或傳送 `userId`；伺服端必須從 session cookie 推導 principal，並拒絕 body 中偽造的身份欄位。
- 既有未追蹤的 `.codebase-memory/` 與任何使用者既有修改不在本次範圍，不能納入 commit、清理或更動。

## 已確認的決策紀錄

| 議題 | 決策 | 落地時點 | 不做的事 |
|---|---|---|---|
| `detailUrl` 矛盾 | `search_events` 的每筆成功結果正式加入 `detailUrl`。 | Day 24，因為這一天才有可導覽的真實詳情路由。 | 不回頭改 Day 17／18 的 contract、文章或 snapshot。 |
| 寫入的可信任邊界 | Day 21–26 新增最小同源 Demo API 與測試 session。 | Day 21 先完成 API 與 `save_event`，Day 26 以拒絕案例驗證。 | 不做完整登入、資料庫、OAuth 或 RBAC 平台。 |
| 後半段基線 | `v0.1.0-day-18` 是唯一開發基線。 | Task 1。 | 不從 `main` 接續，也不先把 Day 18 併回 `main`。 |
| 「授權」的表述 | Demo 驗證的是：伺服端不信任前端身份欄位，且以測試 session 決定可寫入的收藏集合。 | Day 26。 | 不假稱公開活動有「活動擁有者」或已達企業級 authorization。 |

## 預期檔案地圖

| 路徑 | 責任 | 建立／調整日 |
|---|---|---:|
| `docs/evidence/day-19-side-effect-boundaries.md` | 讀取、低風險可復原寫入與人工確認的風險矩陣。 | 19 |
| `docs/evidence/day-20-human-confirmation.md` | 報名的準備／確認界線與線框證據，不新增報名 Tool。 | 20 |
| `src/domain/event-catalog.ts` | 前後端共用的唯讀活動目錄與 `findEventById`。 | 21 |
| `server/domain/demo-session-store.ts` | 不透明測試 session 建立與 cookie token → principal 查詢。 | 21 |
| `server/domain/saved-events-service.ts` | 依 principal 維護收藏集合、冪等 save、list、remove。 | 21 |
| `server/http/dev-api-server.ts` | `/api` 路由、cookie／JSON 解析、HTTP 錯誤轉換。 | 21 |
| `server/dev-api.ts` | 可執行的本機 API 入口，預設監聽 `127.0.0.1:8787`。 | 21 |
| `src/client/saved-events-api.ts` | 瀏覽器端同源 API client；永不接受 `userId`。 | 21 |
| `src/application/save-event.ts` | UI 與 Tool 共用的收藏 use case；先在 Day 21 建立，Day 23 完成收斂。 | 21／23 |
| `src/client/event-route.ts` | `?event=<eventId>` 詳情路由解析與導覽。 | 24 |
| `src/domain/event-detail-url.ts` | 從 base URL 與 `eventId` 建立可一般瀏覽器開啟的絕對 `detailUrl`。 | 24 |
| `src/webmcp/webmcp-adapter.ts` | 唯一接觸 `document.modelContext` 的 adapter 與可撤銷註冊介面。 | 21 前置修正 |
| `src/webmcp/current-event-tool-lifecycle.ts` | 依 route 註冊／清理 `search_events`、`get_event_details`、`save_event`。 | 24 |
| `tests/server/demo-api.test.ts` | session、冪等性、偽造身份、未知活動的 HTTP 契約測試。 | 21／26 |
| `tests/application/save-event.test.ts` | UI／Tool 共用 use case 的成功與 errorCode 測試。 | 21／23 |
| `tests/domain/event-detail-url.test.ts` | `detailUrl` 的純函式測試。 | 24 |
| `tests/webmcp/current-event-tool-lifecycle.test.ts` | 路由變動、可用 Tool 與 route mismatch 測試。 | 24 |
| `tests/browser/day-22-visible-state.spec.ts` | 收藏後 UI 可見、重新載入同步與人類取消收藏。 | 22 |
| `tests/browser/day-25-agent-journey.spec.ts` | browser test double 的完整 Tool／導覽 journey。 | 25 |
| `docs/evidence/day-24-tool-lifecycle.md` | `detailUrl` 導覽與 Tool 清單前後對照。 | 24 |
| `docs/evidence/day-25-agent-journey.md` | 完整 journey、test double 與原生環境證據分欄。 | 25 |
| `docs/evidence/day-26-trusted-boundary.md` | session、伺服端拒絕與已知限制。 | 26 |
| `package.json`、`package-lock.json`、`tsconfig.json`、`vite.config.ts` | API 開發／測試 scripts、server 型別編譯與 `/api` proxy。 | 21 |
| `D:\MySelf\iThome-2026\WebMCP\WEBMCP-iThome-2026-Draft-V2\ArticleBriefs.md` | 修正 `detailUrl` 的時序與 Day 21／26 的誠實描述。 | 2、26 |

## 契約先行

### 1. 可導覽的搜尋結果（Day 24 起）

`searchEventsForTool` 維持純粹的搜尋領域邏輯；只有 WebMCP 輸出 adapter 在有 page base URL 的位置加上 `detailUrl`。這可避免 server-side／unit test 依賴 `window`。

```ts
export type SearchEventsToolResultItem = {
  eventId: string;
  title: string;
  category: string;
  date: string;
  location: string;
  summary: string;
  detailUrl: string;
};

export function createEventDetailUrl(baseUrl: string, eventId: string): string {
  const url = new URL(baseUrl);
  url.search = '';
  url.hash = '';
  url.searchParams.set('event', eventId);
  return url.toString();
}
```

唯一支援的詳情 URL 格式為 `https://<host>/?event=<eventId>`。不使用 hash 路由，也不在 Day 24 引入 router framework。

### 2. 最小 API 與測試 session（Day 21 起）

```ts
export type DemoPrincipal = Readonly<{ userId: 'demo-reader' }>;

export type SaveEventSuccess = Readonly<{
  status: 'ok';
  eventId: string;
  saved: true;
  changed: boolean;
}>;

export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'EVENT_NOT_FOUND'
  | 'UNEXPECTED_IDENTITY_FIELD';

export type ApiError = Readonly<{
  status: 'error';
  errorCode: ApiErrorCode;
  message: string;
  guidance: string;
}>;
```

| HTTP endpoint | 成功行為 | 失敗行為 |
|---|---|---|
| `POST /api/demo-session` | 寫入 `HttpOnly; SameSite=Lax; Path=/` cookie，回傳 `{ status: 'ok' }`。 | 僅接受空 body；不需 user ID。 |
| `GET /api/session` | 回傳目前 demo session 的 `{ status: 'ok', authenticated: true }`。 | 無效／缺少 cookie 回 `401 UNAUTHENTICATED`。 |
| `GET /api/saved-events` | 只回傳 session principal 自己的 `eventId[]`。 | 無效／缺少 cookie 回 `401 UNAUTHENTICATED`。 |
| `PUT /api/saved-events/:eventId` | 第一次 `changed: true`；重複呼叫 `changed: false`，均為 `saved: true`。 | 無 session、未知活動，或 JSON body 含 `userId` 時回結構化錯誤。 |
| `DELETE /api/saved-events/:eventId` | 人類 UI 的可復原入口，回傳是否真的移除。 | 不作為 WebMCP Tool；錯誤規則與 PUT 一致。 |

### 3. 詳情頁 Tool 合約（Day 24 起）

```ts
export type RouteMismatchError = Readonly<{
  status: 'error';
  errorCode: 'ROUTE_MISMATCH';
  message: string;
  guidance: string;
}>;

// 詳情 route 為 ?event=evt-frontend-2026 時，兩個 Tool 都只接受此 eventId。
get_event_details({ eventId: 'evt-frontend-2026' });
save_event({ eventId: 'evt-frontend-2026' });
```

如果傳入 ID 不等於目前 route，Tool 必須在發 HTTP 前回 `ROUTE_MISMATCH`。未知 ID 則由伺服端以 `EVENT_NOT_FOUND` 回應。這兩類錯誤不能混為一談。

## 每日交付與證據矩陣

| Day | 讀者快照 | 本日可證明的主張 | 最低證據 |
|---:|---|---|---|
| 19 | `day-19-side-effect-boundaries`／`v0.1.0-day-19` | 收藏是低風險、可復原寫入；報名仍需人類確認。 | 風險矩陣與 UI 對照圖。 |
| 20 | `day-20-human-in-the-loop`／`v0.1.0-day-20` | AI 可準備報名資訊，但不能送出。 | 流程、確認畫面線框與「沒有 registration Tool」的清單。 |
| 21 | `day-21-save-event`／`v0.1.0-day-21` | `save_event` 透過測試 session 寫入，且冪等。 | API unit/integration test、第一次／第二次結果。 |
| 22 | `day-22-visible-tool-state`／`v0.1.0-day-22` | Tool 寫入後，人類 UI 同步可見並可自行取消。 | Playwright UI 前後畫面與 reload 後 state。 |
| 23 | `day-23-shared-use-case`／`v0.1.0-day-23` | UI 與 Tool 呼叫同一個 `saveEvent` use case。 | 呼叫圖、spy test 與共用輸出。 |
| 24 | `day-24-tool-lifecycle`／`v0.1.0-day-24` | `detailUrl` 可導覽；路由決定 Tool；過期 Tool 被清理。 | route/tool-list test、明確 URL、browser test double 記錄。 |
| 25 | `day-25-agent-journey`／`v0.1.0-day-25` | 完成搜尋、導覽、詳情、收藏的單一路徑。 | 完整 journey test、截圖、原生／test double 證據矩陣。 |
| 26 | `day-26-server-authorization`／`v0.1.0-day-26` | 伺服端以 session 判定寫入 principal，拒絕偽造身份與未登入請求。 | HTTP 401／400／404 tests、限制聲明。 |

## 實作工作

### Task 1：建立正確的 Day 18 基線與不可變歷史清單

**Files:**
- Create `docs/evidence/day-19-to-day-26-baseline.md`
- Modify `docs/versioning.md`

- [ ] 以唯讀指令記錄 `main`、`v0.1.0-day-18`、`day-18-*`、`v0.1.0-day-17` 的 SHA 與 ancestor 關係；文件必須明載 `main=8d12bed`、Day 18 baseline=`615ee1c`。
- [ ] 由 tag 建立 feature worktree，而不是從目前 checkout 複製檔案：

```powershell
git -C D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2 worktree add `
  D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-day19-26 `
  -b feature/day-19-to-day-26-agent-journey v0.1.0-day-18
```

- [ ] 在新 worktree 執行並保存結果：

```powershell
npm ci
npm run typecheck
npm test
npm run test:browser
npm run build
```

- [ ] 在 `docs/versioning.md` 增加 Day 19–26 的 branch/tag 對照與「從 Day 18 漸進」規則；Day 1–18 的 SHA 僅記錄，不修改 ref。

**驗收：** `git merge-base --is-ancestor v0.1.0-day-18 HEAD` 成功，且 `git diff v0.1.0-day-18..HEAD` 在 Task 1 後只有 baseline/versioning 文件。

### Task 2：先修正文章真實性契約，再開始改程式

**Files:**
- Modify `D:\MySelf\iThome-2026\WebMCP\WEBMCP-iThome-2026-Draft-V2\ArticleBriefs.md`
- Modify `D:\MySelf\iThome-2026\WebMCP\WEBMCP-iThome-2026-Draft-V2\BookProposal.md`
- Create `docs/evidence/day-19-contract-decisions.md`

- [ ] 將固定 journey 改成具時序的敘述：Day 17／18 的搜尋結果仍只有不透明 `eventId`；Day 24 因新增真實詳情 route，才把 `detailUrl` 加入 `search_events` 的 output。
- [ ] Day 21 的 brief 明定 `save_event` 是「只加不切換」的冪等 command；復原方式是 Day 22 人類 UI 的取消收藏，不能描述為 `save_event` 的 toggle 或另一個 Agent Tool。
- [ ] Day 26 的 brief 把「偽造不屬於目前使用者的 eventId」改為三個可驗證案例：未登入／無效 session、body 中偽造 `userId`、不存在的公開 `eventId`。明載公開活動沒有使用者所有權，Demo 不宣稱完整授權系統。
- [ ] `BookProposal.md` 的 Day 21／26 說明同步使用「測試 session 驗證的伺服端可信任邊界」措辭，避免宣稱完整帳號或企業級 RBAC。

**驗收：** `rg -n 'Day 17.*detailUrl|不屬於目前使用者|資料擁有者檢查' ArticleBriefs.md` 沒有與上述決策相衝突的描述；`docs/evidence/day-19-contract-decisions.md` 可讓文章與程式 reviewer 看懂時序。

### Task 3：Day 19 與 Day 20 先交付風險界線，不偷渡功能

**Files:**
- Create `docs/evidence/day-19-side-effect-boundaries.md`
- Create `docs/evidence/day-20-human-confirmation.md`
- Create `docs/evidence/assets/day-19-risk-matrix.svg`
- Create `docs/evidence/assets/day-20-confirmation-flow.svg`

- [ ] Day 19 風險矩陣固定三列：`search_events`（無副作用）、`save_event`（低風險／可由 UI 復原）、`register_for_event`（高責任／只允許人類確認）。每列都標示 Agent 能做的範圍、使用者可見性與復原方式。
- [ ] Day 20 線框固定呈現：AI 只能填入「準備報名」草稿，網站必須顯示活動、個資、送出影響與人類的「確認送出」按鈕；此按鈕不登錄成 WebMCP Tool。
- [ ] 用既有網站畫面截圖加上註解或單純 SVG，不能把假想 registration 呼叫錄製成真實功能。證據文件要有 `Evidence type: design boundary` 標記。
- [ ] 建立 Day 19 snapshot 後，新 clone 執行 `npm ci; npm run build; npm test`；再建立 Day 20 snapshot 進行相同驗證。

**驗收：** Day 19／20 都沒有 `register_for_event` source、Tool declaration、HTTP endpoint 或 payment code；文件與 assets 是唯一新行為。

### Task 4：以測試驅動建立 Demo API 與 session 邊界（Day 21 的伺服端基礎）

**Files:**
- Modify `package.json`
- Modify `package-lock.json`
- Modify `tsconfig.json`
- Modify `vite.config.ts`
- Create `src/domain/event-catalog.ts`
- Create `server/domain/demo-session-store.ts`
- Create `server/domain/saved-events-service.ts`
- Create `server/http/dev-api-server.ts`
- Create `server/dev-api.ts`
- Create `tests/server/demo-api.test.ts`

- [ ] 在實作前先寫 `tests/server/demo-api.test.ts`。以 Node 22 `fetch` 對暫時 port 的 `createDevApiServer()` 測試下列行為：

```ts
expect((await putSavedEventWithoutCookie('evt-frontend-2026')).status).toBe(401);
expect(await errorCodeOf(response)).toBe('UNAUTHENTICATED');

const cookie = await createDemoSession();
expect(await putSavedEvent(cookie, 'evt-frontend-2026')).toMatchObject({
  status: 'ok', eventId: 'evt-frontend-2026', saved: true, changed: true
});
expect(await putSavedEvent(cookie, 'evt-frontend-2026')).toMatchObject({ changed: false });
expect(await putSavedEvent(cookie, 'no-such-event')).toMatchObject({
  status: 'error', errorCode: 'EVENT_NOT_FOUND'
});
expect(await putSavedEvent(cookie, 'evt-frontend-2026', { userId: 'admin' })).toMatchObject({
  status: 'error', errorCode: 'UNEXPECTED_IDENTITY_FIELD'
});
```

- [ ] 從目前 `src/domain/events.ts` 抽出不依賴 DOM 的活動資料與 `findEventById(eventId)` 至 `src/domain/event-catalog.ts`；現有 UI 行為不得改變。
- [ ] 建立 `createDemoSessionStore(randomUUID)`：token 不能由 client 指定，principal 固定為教學用 `demo-reader`。cookie parser 必須只讀 `demo_session`，不得信任 query string、header 或 JSON 的 userId。
- [ ] 建立 `createSavedEventsService({ findEventById })`；內部資料結構是 `Map<DemoPrincipal['userId'], Set<string>>`。`save()` 必須回傳 `changed`，`remove()` 與 `list()` 必須只看 session principal。
- [ ] 使用 `node:http` 實作 API server，所有 error 都以 JSON `ApiError` 回應；未知 route 回一般 404，但 domain 的未知活動必須是 `EVENT_NOT_FOUND`。
- [ ] 在 `package.json` 新增精確 scripts：

```json
{
  "dev:web": "vite --host 127.0.0.1",
  "dev:api": "tsx server/dev-api.ts",
  "dev": "concurrently -k -n api,web \"npm:dev:api\" \"npm:dev:web\"",
  "test:server": "vitest run tests/server"
}
```

新增 dev dependencies `tsx` 與 `concurrently`，以 lockfile 固定版本。`tsconfig.json` 的 `include` 必須加入 `server`；`vite.config.ts` 設定 `/api` proxy 到 `http://127.0.0.1:8787`，使瀏覽器 API 呼叫保持同源。

**驗收：** `npm run typecheck && npm run test:server && npm run build` 通過；直接啟動 `npm run dev` 後，`POST /api/demo-session` 經 Vite proxy 回傳 cookie，沒有 CORS 設定或 client user ID。

### Task 5：實作 Day 21 的冪等 `save_event`，並先校正 WebMCP adapter 邊界

**Files:**
- Create `src/client/saved-events-api.ts`
- Create `src/application/save-event.ts`
- Create `src/webmcp/webmcp-adapter.ts`
- Modify `src/webmcp/types.ts`
- Modify `src/webmcp/search-events-tool.ts`
- Modify `src/main.ts`
- Create `tests/application/save-event.test.ts`
- Create `tests/webmcp/save-event-tool.test.ts`
- Modify `tests/browser/webmcp-runtime.spec.ts`
- Create `docs/evidence/day-21-save-event.md`

- [ ] 在 browser client 實作 `createSavedEventsApi(fetch)`，所有 request 使用 `credentials: 'same-origin'`，且 command type 只有 `{ eventId: string }`。client API interface 必須是：

```ts
export interface SavedEventsApi {
  createDemoSession(): Promise<void>;
  listSavedEventIds(): Promise<readonly string[]>;
  saveEvent(eventId: string): Promise<SaveEventSuccess | ApiError>;
  removeEvent(eventId: string): Promise<{ status: 'ok'; eventId: string; changed: boolean } | ApiError>;
}
```

- [ ] 實作 `createSaveEventUseCase({ api, getCurrentRoute })`。在任何 HTTP request 前，輸入 ID 與 current route 不一致時回傳 `ROUTE_MISMATCH`；成功結果不得是 toggle，第二次 save 必須保持 `saved: true, changed: false`。
- [ ] `save_event` descriptor 只在詳情 route 宣告，`description` 明示「收藏目前顯示的活動；重複執行安全；若要取消收藏，交由使用者在網站 UI 操作」。
- [ ] 先做 Chrome WebMCP adapter 的相容性 preflight：以當日可用 Chrome 官方文件與 Inspector 實際形狀確認宣告／執行 API，將所有 `document.modelContext` 接觸集中在 `src/webmcp/webmcp-adapter.ts`。外層介面固定為：

```ts
export interface WebMcpAdapter {
  replaceTools(tools: readonly WebMcpToolDefinition[]): Promise<void>;
  clearTools(): void;
}
```

  `registerTool()` 是非同步原生 API，因此 `replaceTools()` 必須回傳 `Promise<void>`，由呼叫端明確等待註冊完成；`clearTools()` 以 AbortController 同步撤銷目前註冊。若真實瀏覽器不支援，adapter 要顯示可診斷的 unsupported state；不能用 test double 填補原生成功宣稱。這是 Day 21 新功能分支的前置修正，不重寫 Day 14–18 的歷史 snapshots。
- [ ] `tests/application/save-event.test.ts` 驗證 route mismatch 不呼叫 `api.saveEvent`、首次／重複成功與每個 API `errorCode` 原樣傳遞；`tests/webmcp/save-event-tool.test.ts` 驗證 descriptor、輸入解析與回應。
- [ ] Day 21 evidence 需包含：HTTP 測試輸出、同一 event 的第一次／第二次回傳、WebMCP adapter 證據矩陣。test double 明示標記；原生欄位未支援時記錄 browser full version、flags、Inspector 畫面與日期。

**驗收：** `npm run typecheck && npm test && npm run test:browser && npm run build` 通過。建立 Day 21 branch/tag 後，用 `git clone --branch day-21-save-event --single-branch` 重跑 `npm ci`、`typecheck`、`test`、`test:browser`、`build`。

### Task 6：讓 Day 22 的寫入回到人類可見且可復原的 UI

**Files:**
- Modify `src/main.ts`
- Modify `src/styles.css`（僅在需要顯示 saved state 時）
- Modify `src/client/saved-events-api.ts`
- Create `tests/browser/day-22-visible-state.spec.ts`
- Create `docs/evidence/day-22-visible-tool-state.md`

- [ ] 頁面啟動先呼叫 `createDemoSession()`，再以 `listSavedEventIds()` 建立 UI state；不能再以記憶體 `savedEventIds` 當權威來源。
- [ ] 收藏成功後，活動卡／詳情區與收藏清單都必須立即顯示同一份 server state；重新載入同一個 API process 後仍須可見。
- [ ] 人類「取消收藏」按鈕呼叫 `DELETE /api/saved-events/:eventId`，成功後更新同一份 state。不得把 delete tool 註冊到 WebMCP。
- [ ] Playwright 流程固定為：建立 session → 透過可測 Tool path 收藏 → 斷言可見成功狀態 → reload → 斷言仍收藏 → 點 UI 取消收藏 → 斷言恢復未收藏。對 browser test double 的使用要寫在測試名稱或 evidence 文件，不要命名成 native Agent test。

**驗收：** `tests/browser/day-22-visible-state.spec.ts` 能在未使用 browser Tool 時也驗證人類 UI undo；Day 22 screenshot 顯示收藏前後與取消收藏後三個狀態。

### Task 7：Day 23 收斂 UI 與 Tool 的共用 use case

**Files:**
- Modify `src/application/save-event.ts`
- Modify `src/main.ts`
- Modify `src/webmcp/current-event-tools.ts`（若 Task 5 將 Tool 放此檔）
- Modify `tests/application/save-event.test.ts`
- Create `tests/application/save-event-callers.test.ts`
- Create `docs/evidence/day-23-shared-use-case.md`

- [ ] 將 UI 收藏按鈕與 `save_event` handler 都接到同一個 `SaveEventUseCase.execute({ eventId })`；UI 可負責 rendering，Tool 可負責 schema／JSON mapping，但兩者不得各自呼叫不同 API 或各自計算 `changed`。
- [ ] 在 caller test 注入同一個 fake use case，驗證 UI 與 Tool 都只呼叫 `execute` 一次，且收到相同的 `SaveEventSuccess | ApiError`。
- [ ] 用 imports 和測試確保 UI／Tool 沒有直接進入 `SavedEventsApi.saveEvent`。此限制是針對收藏流程，不做整個專案的抽象化重寫。

**驗收：** 共享流程圖、spy test 與 runtime test 都能證明只有一個收藏規則來源；既有 Day 21 API 契約不變。

### Task 8：Day 24 新增可導覽 `detailUrl` 與 route-aware Tool lifecycle

**Files:**
- Create `src/domain/event-detail-url.ts`
- Create `src/client/event-route.ts`
- Create `src/webmcp/current-event-tool-lifecycle.ts`
- Modify `src/webmcp/search-events-tool.ts`
- Modify `src/webmcp/search-events-runtime.ts`
- Modify `src/main.ts`
- Create `tests/domain/event-detail-url.test.ts`
- Create `tests/client/event-route.test.ts`
- Create `tests/webmcp/current-event-tool-lifecycle.test.ts`
- Create `tests/browser/day-24-tool-lifecycle.spec.ts`
- Create `docs/evidence/day-24-tool-lifecycle.md`

- [ ] 先寫 `createEventDetailUrl` test，固定輸入 `https://events.example.test/?query=old#old` 和 `evt-frontend-2026`，預期輸出為 `https://events.example.test/?event=evt-frontend-2026`。
- [ ] 實作 `readEventRoute(search)`：無 `event` 為 search route；已知 event 為 detail route；未知 event 要顯示 not-found state 且不註冊詳情 Tool。所有內部詳情連結與 `detailUrl` 都只使用 `?event=<eventId>`。
- [ ] 把 Day 17 的 `SearchEventsToolResultItem` 向前相容擴充 `detailUrl`。純領域搜尋仍只回 event data；WebMCP output mapping 接受一個明確的 `detailUrlFor(eventId)` dependency，再加入欄位。測試使用固定 base URL，不讀 global `document`。
- [ ] 實作 lifecycle 規則：search route 只暴露 `search_events`；detail route 只暴露 `get_event_details`、`save_event`；route change 必須先清理舊 tool，再註冊新 tool。`get_event_details` 與 `save_event` 都驗證 input `eventId === route.eventId`，否則立即回 `ROUTE_MISMATCH` 且不可呼叫 API。
- [ ] lifecycle test 以可觀察 adapter fake 驗證每次 `replaceTools()` 的名稱清單，並驗證從 detail 回 search 不殘留 `get_event_details` 或 `save_event`。browser test double 必須記錄「搜尋結果中的 URL → 一般瀏覽器導覽 → 新 tool list」三個證據點。

**驗收：** `search_events` 在 Day 24 snapshot 才含 `detailUrl`，而 Day 17／18 tags 的輸出仍不含它；`npm run test:browser -- --grep "Day 24"` 與 unit tests 都通過。

### Task 9：Day 25 固定一條完整、可停止的 Agent Journey

**Files:**
- Create `tests/browser/day-25-agent-journey.spec.ts`
- Create `tests/integration/day-25-agent-journey.test.ts`
- Create `docs/evidence/day-25-agent-journey.md`
- Create `docs/evidence/assets/day-25-agent-journey.svg`

- [ ] 以固定需求與固定活動，建立下列唯一 happy path；每一步都保存輸入、輸出、可用 Tool 名稱和 UI evidence：

```text
search_events({ keyword: "前端" })
  -> 取得 results[0].eventId 與 results[0].detailUrl
  -> browser 導覽 detailUrl
  -> get_event_details({ eventId })
  -> save_event({ eventId })
  -> { status: "ok", saved: true, changed: true }
```

- [ ] 加入兩個停止條件：搜尋為空時不導覽；任一 `errorCode` 或 `ROUTE_MISMATCH` 出現時停止，不猜 ID、不改 URL、不改呼叫下一個 Tool。
- [ ] integration test 可以使用 adapter fake，但檔名與 evidence 必須標示 `test-double`。若有真實 Chrome Inspector／Agent 環境，另建 `docs/evidence/day-25-native-observation.md`，保存 Chrome 完整版本、旗標、日期、手動操作和截圖；不支援也建立同檔案記錄 unsupported state。
- [ ] screenshot 固定包含搜尋結果可見 `detailUrl`、詳情頁與收藏成功；不可把 test double 的畫面標示為原生 Agent。

**驗收：** Day 25 snapshot clone 可獨立執行 journey test；evidence 文件能讓 reviewer 在不看原始碼下區分「可重複自動測試」與「瀏覽器原生證據」。

### Task 10：Day 26 以 server-side session 驗證可信任邊界與拒絕行為

**Files:**
- Modify `tests/server/demo-api.test.ts`
- Modify `tests/application/save-event.test.ts`
- Create `tests/browser/day-26-trusted-boundary.spec.ts`
- Create `docs/evidence/day-26-trusted-boundary.md`
- Modify `D:\MySelf\iThome-2026\WebMCP\WEBMCP-iThome-2026-Draft-V2\ArticleBriefs.md`

- [ ] API tests 必須覆蓋：
  1. 沒 cookie 或無效 cookie → `401 UNAUTHENTICATED`。
  2. 建立 session 後，client 只可看到該 session principal 的收藏集合。
  3. `PUT` body 帶 `{ "userId": "another-user" }` → `400 UNEXPECTED_IDENTITY_FIELD`，不改資料。
  4. 合法 session 對不存在 event → `404 EVENT_NOT_FOUND`。
  5. 前端／Tool 的 route ID 不符 → `ROUTE_MISMATCH`，且 spy 證明沒有 HTTP request。
- [ ] Browser test 只驗證 UI 不能透過 DOM 自己改變 server source of truth；最終判斷仍以 API response 與 session state 為準。不要把「手動改前端 state」描述成成功偽造請求。
- [ ] evidence 的責任圖固定三層：Tool declaration（能力說明）、client route／UI（使用者體驗與早期防呆）、Demo API session（可信任寫入判斷）。在圖下明列限制：單一測試 identity、in-memory state、無 password／OAuth／database、非 production security audit。
- [ ] 更新 ArticleBriefs Day 26，使文章的攻擊情境與實作／測試的三個拒絕 case 完全一致。

**驗收：** 全部拒絕測試不只 assert HTTP status，還要 assert `errorCode` 和資料未改變；文件不再使用「偽造別人的公開活動 eventId」或「完整授權」的說法。

### Task 11：逐日切片、審查與讀者快照驗證

**Files:**
- Modify `docs/versioning.md`
- Create `docs/evidence/reader-snapshot-smoke-day-19-to-day-26.md`
- Create／Modify `docs/evidence/runtime-matrix-day-19-to-day-26.md`

- [ ] 每完成一日，只 stage 該日明確檔案，建立一個可審查 commit，然後建立 branch/tag：

```text
day-19-side-effect-boundaries       / v0.1.0-day-19
day-20-human-in-the-loop            / v0.1.0-day-20
day-21-save-event                   / v0.1.0-day-21
day-22-visible-tool-state           / v0.1.0-day-22
day-23-shared-use-case              / v0.1.0-day-23
day-24-tool-lifecycle               / v0.1.0-day-24
day-25-agent-journey                / v0.1.0-day-25
day-26-server-authorization         / v0.1.0-day-26
```

- [ ] 對每個 ref 在暫存資料夾執行：

```powershell
git clone --branch <day-branch> --single-branch <repository-url> <temporary-reader-folder>
Set-Location <temporary-reader-folder>
npm ci
npm run typecheck
npm test
npm run test:browser
npm run build
```

  Day 19／20 雖然無 runtime 功能，仍執行相同的 baseline gates。Day 21 以後需另外啟動 `npm run dev`，驗證 Vite proxy 後的 `POST /api/demo-session`、`PUT /api/saved-events/:eventId` 和 UI loading 沒有失敗。
- [ ] 每一日進行 reviewer gate：diff 對照本計畫、沒有 placeholder／`TODO`、沒有不誠實 native claim、`errorCode` 型別完整、無 `userId` client input、只存在三個正式 Tool、沒有未追蹤使用者檔案被納入。
- [ ] Day 26 完成後才對 `feature/day-19-to-day-26-agent-journey` 做完整 code review。review clean、讀者 clone gates、evidence matrix 都通過後，提出「是否整合回 main」給使用者決定；在使用者明確同意前不 merge、不 tag main、不 push。

**驗收：** `docs/evidence/reader-snapshot-smoke-day-19-to-day-26.md` 對 8 個日 ref 各有 SHA、clone 時間、Node 版本、五個命令結果與失敗處理紀錄；`main` 仍維持未被後半段功能直接污染的狀態。

## 最終驗證清單

- [ ] `git diff v0.1.0-day-18..feature/day-19-to-day-26-agent-journey` 只包含本計畫列出的行為、測試、證據與版本文件。
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run test:server`
- [ ] `npm run test:browser`
- [ ] `npm run build`
- [ ] Day 19–26 八個 branch/tag 的 fresh-clone smoke test 全數通過。
- [ ] `search_events` 的 `detailUrl` 僅存在 Day 24 以後 snapshots；Day 17／18 historical contract 未被改寫。
- [ ] `save_event` 只在詳情 route 可用、冪等、不帶 user ID、route mismatch 不發 HTTP；取消收藏沒有 WebMCP Tool。
- [ ] Day 25／26 evidence 能明確區分 native Chrome evidence、browser test double 和純 HTTP tests。
- [ ] 文章只在對應 snapshot、截圖與 evidence 固定後撰寫；撰寫時以 Day 1–18 已凍結的敘事標準與 `humanizer-zh-tw` 做最後文字校正。

## 建議的執行節奏

1. Task 1–3：先鎖定基線、消除 brief 矛盾、完成 Day 19／20 的概念證據。
2. Task 4–7：以 API tests 帶動 Day 21–23 的可信任寫入與 UI／Tool 共用規則。
3. Task 8–10：最後才擴充 `detailUrl`、route lifecycle、完整 journey 與 server-side 拒絕證據。
4. Task 11：逐日 clone、審查後才決定是否把功能分支整合回 `main`；文章撰寫在證據凍結後進行。
