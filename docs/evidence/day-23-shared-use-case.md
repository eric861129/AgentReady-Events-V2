# Day 23：UI 與 Tool 共用收藏 use case

## 目標

人類 UI 的收藏按鈕與 `save_event` Tool 都只能呼叫
`SaveEventUseCase.execute({ eventId })`。兩個 caller 不得直接呼叫
`SavedEventsApi.saveEvent`，也不得自行根據 `changed` 決定收藏結果。

## 邊界

```text
活動卡／詳情 UI ─┐
                 ├─> SaveEventUseCase.execute({ eventId }) ─> SavedEventsApi.saveEvent
save_event Tool ─┘
```

- `src/ui/save-event-handler.ts`：只將 UI 的 `eventId` 交給 use case，成功與失敗後的畫面更新保留在 UI callback。
- `src/webmcp/save-event-tool.ts`：只做 Tool input schema 驗證與 JSON result mapping。
- `src/application/save-event.ts`：唯一可呼叫 `SavedEventsApi.saveEvent` 的收藏流程；當有目前詳情 route 時，仍拒絕不同的 `eventId`。
- 未開啟詳情的活動卡 UI 可使用同一 use case；`save_event` 只在已選取詳情時註冊，因此 Tool 仍受目前 route 約束。

## 可重現驗證

```powershell
npm test -- tests/application/save-event.test.ts tests/application/save-event-callers.test.ts tests/webmcp/save-event-tool.test.ts
npx playwright test tests/browser/day-22-visible-state.spec.ts
npm run typecheck
```

`tests/application/save-event-callers.test.ts` 使用 fake `SaveEventUseCase` 的 spy，分別證明 UI caller 與 Tool caller 各以相同的 `{ eventId }` 呼叫一次；同時涵蓋 `SaveEventSuccess` 與 `ApiError` 的 UI 邊界處理。

## Snapshot gate（review 補強）

2026-07-20 以 Day23 現有 reader branch 建立真正的單分支 clone；沒有移動 branch 或 tag。

```powershell
git clone --no-local --single-branch --branch day-23-shared-use-case `
  D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-day19-26 `
  C:\Users\ERICHU~1\AppData\Local\Temp\agent-ready-events-v2-day23-review-20260720205940\repository
```

- branch clone HEAD：`e29e30182179af45d4fa4a7afd3c8aeac7abe040`
- `v0.1.0-day-23^0` peeled SHA：`e29e30182179af45d4fa4a7afd3c8aeac7abe040`
- `npm ci`：新增 80 packages、audit 81 packages、0 vulnerabilities。
- `npm run typecheck`：passed。
- `npm test`：14 test files、65 passed。
- `npm run test:browser`：13 passed。
- `npm run build`：typecheck + Vite production build passed（181 ms）。

本次 caller contract 亦確認兩個入口各一次呼叫 shared use case；對同一筆 `SaveEventSuccess`，UI success boundary 收到完整 result、Tool 原樣回傳 JSON；對同一筆 `ApiError`，UI error boundary 收到完整 result、Tool 同樣原樣回傳 JSON。

## Corrected formal snapshot gate（2026-07-20）

完成受控 correction 後，正式 Day23 branch、tag 與 fresh clone HEAD 都解析為 `d9d1c8dd129c7bf3b94349e480d10bd0e8e531e2`。pre-review `e29e30182179af45d4fa4a7afd3c8aeac7abe040` 已保存於 `archive/day-23-shared-use-case-pre-review` 與 `v0.1.0-day-23-pre-review`。

```powershell
git clone --no-local --single-branch --branch v0.1.0-day-23 `
  D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-day19-26 `
  C:\Users\ERICHU~1\AppData\Local\Temp\agent-ready-events-v2-day23-corrected-20260720210754\repository
```

- `v0.1.0-day-23^0` peeled SHA：`d9d1c8dd129c7bf3b94349e480d10bd0e8e531e2`
- `day-23-shared-use-case` SHA：`d9d1c8dd129c7bf3b94349e480d10bd0e8e531e2`
- clone HEAD：`d9d1c8dd129c7bf3b94349e480d10bd0e8e531e2`
- `npm ci`：新增 80 packages、audit 81 packages、0 vulnerabilities。
- `npm run typecheck`：passed。
- `npm test`：14 test files、64 passed。
- `npm run test:browser`：13 passed。
- `npm run build`：typecheck + Vite production build passed（143 ms）。
