# Day 25：可停止的完整 Agent journey test-double 證據

> Evidence date: 2026-07-20（Asia/Taipei）
>
> 證據邊界：本文件記錄的是可重複執行的 **adapter fake / Playwright browser
> test double**。它不是原生 Chrome Inspector、Gemini 對話、真實 Agent discovery
> 或 Agent 自主規劃的證據。

## 固定 contract

- canonical event ID：`event-frontend-summit`；沒有 alias。
- 正式搜尋 Tool：`search_events`。
- 既有正式 input schema 使用 `{ "query": "前端" }`；「前端」是搜尋關鍵字，
  本次不新增 `keyword` 相容欄位。
- 第一筆結果必須同時提供 `eventId` 與 `detailUrl`。
- 詳情 route 只提供 `get_event_details`、`save_event`。
- journey 不解析、重組或修正 `detailUrl`，而是原樣導覽第一筆結果提供的 URL。

## 唯一 happy path

下表的 input/output 由 `tests/integration/day-25-agent-journey.test.ts` 與
`tests/browser/day-25-agent-journey.spec.ts` 鎖定。兩者都明示為 test double。
每一個 Tool invocation step 另保存 `rawOutput`，其值是 `executeTool()` 原樣回傳的
JSON transport string；表中的 `output` 則是由同一筆 `rawOutput` 經 `JSON.parse()`
得到、供 assertions 使用的 structured value。browser 導覽不是 Tool invocation，
因此導覽 step 只有 structured `output`，沒有 `rawOutput`。

| 步驟 | input | output | 執行後 `availableTools` | 文字型 `uiEvidence` |
| --- | --- | --- | --- | --- |
| 1. `search_events` | `{ "query": "前端" }` | `status: "ok"`；`results[0]` 如下 | `search_events` | `搜尋結果：前端體驗設計小聚`、完整 `detailUrl` |
| 2. browser test-double 導覽 | `{ "url": "http://127.0.0.1:4173/?event=event-frontend-summit" }` | `{ "currentUrl": "http://127.0.0.1:4173/?event=event-frontend-summit" }` | `get_event_details`、`save_event` | `活動詳情：前端體驗設計小聚`、`收藏狀態：尚未收藏` |
| 3. `get_event_details` | `{ "eventId": "event-frontend-summit" }` | `status: "ok"` 且回傳同一 canonical event | `get_event_details`、`save_event` | `活動詳情：前端體驗設計小聚`、`收藏狀態：尚未收藏` |
| 4. `save_event` | `{ "eventId": "event-frontend-summit" }` | `{ "status": "ok", "eventId": "event-frontend-summit", "saved": true, "changed": true }` | `get_event_details`、`save_event` | `活動詳情：前端體驗設計小聚`、`收藏狀態：已收藏` |

搜尋第一筆完整資料：

```json
{
  "eventId": "event-frontend-summit",
  "title": "前端體驗設計小聚",
  "category": "前端",
  "date": "2026-08-08",
  "location": "台北市信義區",
  "summary": "從語意、效能到互動細節，重新檢視網頁體驗。",
  "detailUrl": "http://127.0.0.1:4173/?event=event-frontend-summit"
}
```

詳情 Tool output：

```json
{
  "status": "ok",
  "event": {
    "eventId": "event-frontend-summit",
    "title": "前端體驗設計小聚",
    "category": "前端",
    "date": "2026-08-08",
    "location": "台北市信義區",
    "summary": "從語意、效能到互動細節，重新檢視網頁體驗。"
  }
}
```

Playwright attachment 固定命名為
`day-25-agent-journey-browser-test-double.json`，內容包含每一步 input/output、
執行後 Tool inventory、導覽 URL 與當下 UI 文字；三個 Tool invocation step 還包含
`rawOutput`。attachment 本身是結構化 JSON，序列化時 `rawOutput` 會成為 JSON string
欄位；重新 parse attachment 後，該欄位值仍逐字等於 `executeTool()` 回傳字串，不是由
structured `output` 重新 `JSON.stringify()` 的替代品。

browser test 會重新 parse 即將附加的同一份 JSON bytes，確認四個 step 都有 `input`、
`output`、`availableTools`、`uiEvidence`，並確認三個 invocation step 都有字串型
`rawOutput`，且 `JSON.parse(rawOutput)` 深度等於同 step 的 `output`。integration
regression 另以含換行與縮排的 JSON transport string 驗證逐字保存；若未保存 raw
string，或改從 parsed object 重新序列化，測試都會失敗。這份 attachment 是保存 raw
Tool response string 的 browser test-double 證據，不是原生 Agent 或文章用最終截圖。

## 停止條件與無副作用證據

| 情境 | 已執行序列 | stop reason | 明確未發生事項 |
| --- | --- | --- | --- |
| test-double 搜尋回 `results: []` | `search_events` | `EMPTY_RESULTS` | 不導覽、不讀詳情、不收藏 |
| 正式搜尋回一般錯誤 | `search_events` | `NO_RESULTS` | 不猜 event ID、不導覽、不呼叫下一個 Tool |
| test-double 故障注入：第一筆 `eventId` 為 `event-api-contract`，`detailUrl` route 仍為 `event-frontend-summit` | `search_events` → 原樣導覽 → `get_event_details` | `ROUTE_MISMATCH` | 不改 ID、不改 URL、不呼叫 `save_event`；`PUT /api/saved-events/:eventId` 為 0 次 |
| `save_event` 回 `{ status: "ok", saved: true, changed: false }` | 完整呼叫至 `save_event` | `SAVE_NOT_CHANGED` | 不得標示 completed |
| `save_event` 回缺少 `changed` 等 malformed success | 完整呼叫至 `save_event` | `INVALID_SAVE_RESULT_CONTRACT` | 不得標示 completed |

故障注入只存在 test-double 測試，用來證明停止規則；正式 catalog 沒有 alias，也沒有
被改寫。runner 對任何字串 `errorCode` 使用同一停止分支，`ROUTE_MISMATCH` 不會觸發
特殊猜測或 recovery。

流程圖見 [`assets/day-25-agent-journey.svg`](./assets/day-25-agent-journey.svg)。

## 原生觀測狀態

本次沒有可驗證的原生 Chrome Inspector／真實 Agent session。完整版本、flags、手動
步驟與 screenshot 狀態另記錄於
[`day-25-native-observation.md`](./day-25-native-observation.md)，目前誠實標示為
`UNSUPPORTED_FOR_THIS_EVIDENCE_RUN`；這不是宣稱 Chrome 本身不支援 WebMCP。

依 Day 24–26 統一交付決策，本次不建立 Day 25 reader branch/tag，不產生文章用最終
screenshot；正式 reader snapshots、最終截圖與文章延後至 Day 26 完成後一起建立。

## 重現命令

```powershell
npm test -- tests/integration/day-25-agent-journey.test.ts
npm run test:browser -- --grep "Day 25"
npm test
npm run test:browser
npm run typecheck
npm run build
```

2026-07-20 review correction 後 fresh gate：

- 聚焦 integration：1 test file、6 passed。
- 聚焦 Day 25 browser：3 passed。
- `npm test`：18 test files、82 passed。
- `npm run test:browser`：18 passed。
- `npm run typecheck`：passed。
- `npm run build`：typecheck 與 Vite production build passed；19 modules transformed。
