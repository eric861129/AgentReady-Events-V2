# Day 24：`detailUrl` 與 route-aware Tool lifecycle

> Evidence date: 2026-07-20（Asia/Taipei）

## 可重現的 URL contract

`createEventDetailUrl('https://events.example.test/?query=old#old', 'evt-frontend-2026')`
固定得到：

```text
https://events.example.test/?event=evt-frontend-2026
```

既有 query 與 hash 都不會帶入詳情頁。正式 `search_events` 在 WebMCP output mapping
透過明確的 `detailUrlFor(eventId)` dependency 加入 `detailUrl`；純領域
`searchEventsForTool` 的 event data 不讀取 `document` 或 URL，也不包含此欄位。

## Route 與 Tool 清單

| Route | 畫面狀態 | 正式 Tool |
| --- | --- | --- |
| 無 `event` query | 搜尋頁 | `search_events` |
| `?event=event-frontend-summit` | 已知活動詳情 | `get_event_details`、`save_event` |
| `?event=<unknown>` | not-found | 無 |

route 切換會先同步呼叫 lifecycle `invalidate()`：立即中止舊 registration，並推進
generation token；排入既有 Promise queue 的 `replaceTools()` 隨後才註冊完整新清單。
詳情 Tool invocation 同時比對 generation 與 live route，因此即使 replacement 被延遲，
stale handler 也只能回 `ROUTE_MISMATCH`。從詳情回到搜尋頁後，最終不會殘留
`get_event_details` 或 `save_event`。

`get_event_details` 與 `save_event` 都先比對 input `eventId` 與目前 detail route。
不相符時立即回傳：

```json
{
  "status": "error",
  "errorCode": "ROUTE_MISMATCH"
}
```

此分支在讀取詳情 dependency 或呼叫收藏 use case 前就結束；browser regression 也確認
不會因此發出 `PUT /api/saved-events/:eventId`。

## Browser test double 證據邊界

`tests/browser/day-24-tool-lifecycle.spec.ts` 記錄三個可重現證據點：

1. `search_events` 結果中的 `detailUrl`：
   `http://127.0.0.1:4173/?event=event-frontend-summit`。
2. Playwright 以一般瀏覽器導覽 `page.goto(detailUrl)` 進入該 URL。
3. 導覽前後的 Tool 清單由 `['search_events']` 變為
   `['get_event_details', 'save_event']`，返回搜尋頁後再回到 `['search_events']`。

測試會把上述資料附加為 `day-24-tool-lifecycle.json`。這是明確標示的
**browser test double** adapter／頁面整合證據，不是原生 Chrome Agent discovery、
Gemini 對話或 Inspector 證據。

## 歷史 snapshot gate

Day 17 與 Day 18 的 branch／tag 均未移動或修改：

```text
v0.1.0-day-17^0 = 04a7185418f3aa973ed56dae48c49fd9ea7b6d5e
v0.1.0-day-18^0 = 615ee1c10ada38ce70c924a5e80ae272ff18fc9c
```

對兩個 tag 執行 `git grep -n detailUrl <tag> -- src` 都沒有結果；`detailUrl`
只存在 Day 24 向前演進的正式輸出。

## 驗證命令

```powershell
npm test
npm run test:browser -- --grep "Day 24"
npm run test:browser
npm run typecheck
npm run build
```

2026-07-20 提交前 fresh gate：

- `npm test`：17 test files、76 passed。
- `npm run test:browser -- --grep "Day 24"`：2 passed。
- `npm run test:browser`：15 passed。
- `npm run typecheck`：passed。
- `npm run build`：typecheck 與 Vite production build passed；19 modules transformed。

## Review correction：stale handler、required type 與 link semantics

reviewer 指出 detail → search 的同文件 transition 可能在 queued replacement 完成前，
讓呼叫端持有舊的詳情 Tool object。修正後：

- route change 當下同步 `clearTools()` 並增加 generation，不等待 replacement queue。
- `get_event_details` 與 `save_event` 都以建立時 generation 加 live route getter 驗證；
  已過時時，即使 input 仍是原 detail event ID，也回 `ROUTE_MISMATCH`。
- 延遲第二次 `replaceTools()` 的 regression 直接呼叫 stale handler，驗證詳情 dependency
  與真實 `createSaveEventUseCase` 的 `api.saveEvent` 都是 0 次；release 後 active list
  只有 `search_events`。
- domain `SearchEventsToolResultItem` 維持純 event data；正式 WebMCP 邊界另以
  `SearchEventsWebMcpToolResultItem` 宣告必填 `detailUrl: string`，mapper 回傳型別也受此
  contract 約束。
- 可導覽詳情與關閉入口維持原生 `<a>` 語意，不再標示 `role="button"`；browser tests
  與 screenshot capture locator 改以 link role 操作。
