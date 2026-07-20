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
