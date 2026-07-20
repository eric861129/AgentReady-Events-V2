# Day 22：讓寫入回到人類可見且可復原的 UI

> Evidence date: 2026-07-20（Asia/Taipei）

## 可證明的行為

- 頁面啟動順序是先 `POST /api/demo-session`，再 `GET /api/saved-events`；畫面中的 `savedEventIds` 是 server state 的 render snapshot，而不是本地 toggle 的權威資料。
- 人類從活動卡收藏後，活動卡、詳情中的收藏狀態與「我的收藏」清單都會在重新讀取 server state 後更新。
- 同一個 API process 中重新載入頁面後，收藏仍可見；頁面重新建立 Demo session 後再讀取同一 server principal 的收藏清單。
- 「取消收藏」只由人類 UI 發出 `DELETE /api/saved-events/:eventId`。它不是 WebMCP Tool；畫面提供「復原收藏」，並以 `PUT` 回復。

## Playwright UI 證據

`tests/browser/day-22-visible-state.spec.ts` 在沒有注入 `document.modelContext`、沒有 browser test double 的一般 Playwright page 中執行：

1. test fixture 先建立 session 並用直接 `DELETE` 清理共享 Demo API 的基線；這一步不是人類流程證據。
2. 人類流程從空白收藏開始，先開啟詳情確認「尚未收藏」。
3. 按「收藏活動」後，驗證活動卡、詳情與「我的收藏」皆顯示已收藏。
4. `page.reload()` 後仍驗證同一活動為已收藏。
5. 按「取消收藏」後，request trace 必須包含 `DELETE`；詳情改為「尚未收藏」，並出現 UI undo。
6. 按「復原收藏」後，request trace 中剛好有兩個人類流程的 `PUT`（首次收藏與 undo），畫面回到已收藏。

執行結果：

```text
npm run test:browser -- --reporter=line
11 passed
```

最後的 UI 截圖由此測試輸出至 `output/playwright/day-22-visible-tool-state.png`（gitignore 的可重現 artifact）。它顯示「我的收藏」及取消收藏按鈕；此截圖是人類 UI 證據，不是 native Agent／Tool discovery 證據。

## WebMCP 邊界

- Day 22 沒有註冊 delete/remove Tool，`save_event` 的既有行為與 Day 21 route lifecycle 不變。
- 此頁面在一般 browser 下仍誠實顯示 `document.modelContext` unsupported；本日測試不把 Playwright UI 成功宣稱為 native WebMCP 或 AI Agent 成功。
- 既有 `webmcp-runtime.spec.ts` 中的 browser test double 只適用於 Day 21 `save_event` registration/invocation adapter 整合，不能作為 Day 22 native Agent 證據。

## 刻意未做

- 未進行 Day 23 的共用 use case refactor 或 UI／Tool caller 收斂。
- 未進行 Day 24 的 `detailUrl`、`?event=<eventId>`、`get_event_details` 或 route lifecycle。
- 未變更 Day 1–21 branches、tags 或 snapshots。
