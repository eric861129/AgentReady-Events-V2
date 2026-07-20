# Day 21：冪等 `save_event` 與 WebMCP adapter 邊界

> Evidence date: 2026-07-20（Asia/Taipei）

## 本日可證明的行為

- browser client 的收藏 command 只有 `{ eventId: string }`，所有 request 都使用 `credentials: 'same-origin'`，不接受或傳送 `userId`。
- `save_event` 只加入收藏，不是 toggle。同一個 `event-frontend-summit` 第一次收藏回 `changed: true`，第二次回 `changed: false`，兩次都是 `saved: true`。
- 輸入的 `eventId` 與目前顯示的活動詳情不一致時，use case 在 HTTP 前回 `ROUTE_MISMATCH`。
- `save_event` 只在目前有顯示活動詳情時註冊；取消收藏不是 Agent Tool，留給後續的人類 UI。

## HTTP 證據

以 Vite `http://127.0.0.1:4173` 的同源 `/api` proxy 建立 Demo session，先清除測試基線，再對同一活動連續執行兩次 `PUT`：

```text
POST /api/demo-session -> HTTP 201；cookie count: 1

PUT /api/saved-events/event-frontend-summit
HTTP 200
{"status":"ok","eventId":"event-frontend-summit","saved":true,"changed":true}

PUT /api/saved-events/event-frontend-summit
HTTP 200
{"status":"ok","eventId":"event-frontend-summit","saved":true,"changed":false}
```

自動測試：

```text
npm test
Test Files 12 passed (12)
Tests 60 passed (60)
```

## Chrome Imperative API preflight

2026-07-20 讀取 [Chrome 官方 Imperative API 文件](https://developer.chrome.com/docs/ai/webmcp/imperative-api?hl=en)；該頁標示最後更新日期為 2026-07-01。Day 21 adapter 依文件使用下列形狀：

- `await document.modelContext.registerTool(definition, { signal })`
- `AbortController.abort()` 撤銷由該 signal 管理的註冊
- `await document.modelContext.getTools()` 取得已發現的 tool object
- `await document.modelContext.executeTool(tool, JSON.stringify(input))` 手動執行

舊的 `executeTool(name, object)` 沒有保留在原生型別或 production adapter 內。外層 runtime 仍可用名稱尋找 Tool，但實際接觸 Chrome 時一定先取得 tool object，再傳 JSON 字串。

## Adapter／Chrome 證據矩陣

| 層級 | 觀測結果 | 能證明的事 | 不能宣稱的事 |
|---|---|---|---|
| Vitest adapter fake | `replaceTools()` 等待非同步註冊；replacement 與 `clearTools()` 都讓舊 signal 變成 aborted；manual invocation 收到 `(tool, jsonString)` | adapter 合約、等待順序、撤銷與參數轉譯 | 原生 Chrome 或 Agent 已發現 Tool |
| Playwright browser test double | 詳情開啟前只有 `search_events`；開啟後出現 `save_event`；首次／重複收藏得到 `changed: true/false` | 頁面整合、descriptor、輸入與 API 寫入流程 | native Agent proof、Chrome Inspector discovery |
| 實際 Chrome executable | 2026-07-20，Chrome `150.0.7871.125`，實際 tab `http://127.0.0.1:5173/`；直接唯讀觀測 `document.modelContext`、`registerTool`、`getTools`、`executeTool` 均為 `undefined` | 此版本與該頁面的原生 API unsupported state | 不可把 test double 結果當成原生成功 |
| Model Context Tool Inspector／截圖 | Inspector unavailable；browser extension screenshot 在 CDP `Page.captureScreenshot` timeout | 原生 Inspector／畫面證據未取得的完整失敗狀態 | 不宣稱 Inspector 曾發現或執行 `save_event`，也不製造替代截圖 |

Browser test double 的完整結果：

```text
npm run test:browser -- --reporter=line
10 passed
```

## 原生環境觀測與限制

- 日期：2026-07-20。
- 實際 Chrome executable version：`150.0.7871.125`。
- 實際 Chrome tab：`http://127.0.0.1:5173/`。
- 直接唯讀結果：`document.modelContext`、`registerTool`、`getTools`、`executeTool` 全部為 `undefined`。
- Flags：`not observed / no flags asserted`；不推定任何 WebMCP flag 已啟用或停用。
- Model Context Tool Inspector：unavailable。
- Browser extension screenshot：CDP `Page.captureScreenshot` timeout；沒有製造 Inspector screenshot，也沒有以其他畫面冒充。
- 上述只證明這個版本、日期與 tab 的 unsupported state，不是 native Agent discovery 或 invocation。browser test double 證據仍只屬於 adapter／頁面整合測試。

## 刻意未做

- 未加入 Day 22 的 server state UI 同步與人類取消收藏流程。
- 未加入 Day 23 的 UI／Tool caller 收斂證據。
- 未加入 Day 24 的 `?event=<eventId>` URL route、`detailUrl`、`get_event_details` 或正式 route lifecycle。
- 未修改 Day 1–20 的 branch、tag 或歷史 evidence。
