# Task 7 Report — Day 23 Shared Save Event Use Case

## 完成內容

- UI 收藏入口改為 `createSaveEventHumanUiHandler(saveEventUseCase, ...)`；它只呼叫 `execute({ eventId })`，再把成功同步與錯誤顯示交由 UI callback。
- `save_event` Tool 已在 Day 21 透過 `createSaveEventTool(saveEventUseCase, ...)` 呼叫同一個 use case；Day 23 保留其 schema 驗證與 JSON mapping 邊界。
- `SavedEventsApi.saveEvent` 在 UI、Tool 邊界均無直接呼叫；唯一呼叫點是 `src/application/save-event.ts`。
- 保留 Day 21 的 route mismatch 保護：已開啟詳情時，ID 不同會回傳 `ROUTE_MISMATCH`。未開啟詳情時允許活動卡 UI 收藏，維持 Day22 行為；`save_event` 仍僅在已選取詳情時註冊。

## TDD 紀錄

1. RED：先新增 `tests/application/save-event-callers.test.ts`，因 `src/ui/save-event-handler.ts` 尚不存在而以 `Cannot find module` 失敗。
2. GREEN：加入最小 UI handler，使 UI caller 與 Tool caller 的 fake `SaveEventUseCase.execute` 都收到一次相同的 `{ eventId }`。
3. RED：Day22 browser regression 顯示未開啟詳情的活動卡被 `ROUTE_MISMATCH` 阻擋。
4. GREEN：新增無目前 detail route 的 use case 測試，並將 mismatch 條件縮小為「route 存在且 ID 不同」。
5. REFACTOR：主程式移除 UI 對 `savedEventsApi.saveEvent` 的直接呼叫；成功／失敗畫面更新保留在 UI callback。

## 驗證

| Gate | 結果 |
| --- | --- |
| targeted application + Tool tests | 16 passed |
| Day22 browser regression | 3 passed |
| `npm test` | 14 files, 65 passed |
| `npm run build` | typecheck + Vite build passed |
| `git diff --check` | passed |
| static API-boundary search | `src/application/save-event.ts` 為唯一 `saveEvent` 呼叫點 |

## Snapshot

- Branch: `day-23-shared-use-case`
- Tag: `v0.1.0-day-23`
- Commit: `feat(day23): share save event use case across UI and tool`
- Fresh-clone gate：以 tag 建立乾淨 clone 後執行 `npm ci`、targeted tests、typecheck 與 build。

## 自評

範圍僅收斂 UI 與 `save_event` 的收藏 use case；未加入 Day24 的 route、`detailUrl` 或 lifecycle，亦未移動 Day1–22 refs。Task brief 所列的 `src/webmcp/current-event-tools.ts` 在本工作樹不存在；Task5 的實際 Tool 實作是 `src/webmcp/save-event-tool.ts`，baseline 已正確委派 use case，因此沒有為了產生差異而改寫它。

## Review 補強（2026-07-20）

### Caller-result contract 的 TDD

1. RED：將 caller tests 改為讓 UI 與 Tool 分別使用同一筆 fake `SaveEventSuccess`、同一筆 fake `ApiError`。預期失敗：UI success callback 收到空參數，UI error callback 只收到 message；Tool 的 JSON assertions 已通過。
2. GREEN：`SaveEventHumanUiOptions` 的 success/error callback 改為接收完整 discriminated result；`main.ts` 只在 UI error boundary 讀取 `result.message`。Tool mapping 未改動。
3. GREEN verification：`tests/application/save-event-callers.test.ts` 2 passed，`npm run typecheck` passed。

### 現有 Day23 ref 的 single-branch fresh clone

沒有變動 `day-23-shared-use-case` 或 `v0.1.0-day-23`，由 controller 在 review 後處理 audited revision。

```powershell
git clone --no-local --single-branch --branch day-23-shared-use-case `
  D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-day19-26 `
  C:\Users\ERICHU~1\AppData\Local\Temp\agent-ready-events-v2-day23-review-20260720205940\repository
```

| Evidence | Result |
| --- | --- |
| source reader branch | `day-23-shared-use-case` |
| tag peeled SHA (`v0.1.0-day-23^0`) | `e29e30182179af45d4fa4a7afd3c8aeac7abe040` |
| clone HEAD | `e29e30182179af45d4fa4a7afd3c8aeac7abe040` |
| `npm ci` | 80 packages added; 0 vulnerabilities |
| `npm run typecheck` | passed |
| full `npm test` | 14 files, 65 passed |
| `npm run test:browser` | 13 passed |
| `npm run build` | passed; Vite completed in 181 ms |
