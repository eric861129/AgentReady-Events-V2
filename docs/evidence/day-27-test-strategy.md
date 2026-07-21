# Day 27｜WebMCP 最小測試矩陣與可重複驗證

> Evidence date: 2026-07-21（Asia/Taipei）
>
> Entry point: `npm run test:day-27`

## 目的與範圍

Day 27 不追求把所有測試都塞進一個指令，而是保留五個不可缺少的回歸層：正式 Tool contract、route lifecycle、完整任務 journey、Demo API 的可信任邊界，以及 browser 整合。

這個矩陣刻意重用 Day 16、18、21、24、25、26 已有的測試。它不新增 Tool、不變更 catalog fixture，也不把測試數量當成成果本身。

| Layer | Command | Test files | Required assertion | Evidence boundary |
| --- | --- | --- | --- | --- |
| Tool contract | `npm run test:day-27:contract` | `tests/search-events-webmcp-tool.test.ts`, `tests/search-events-tool.test.ts` | `search_events` 成功輸出與具名錯誤輸出維持穩定。 | Tool unit contract；不是 Agent discovery。 |
| Lifecycle | `npm run test:day-27:lifecycle` | `tests/webmcp/current-event-tool-lifecycle.test.ts`, `tests/application/save-event.test.ts` | stale Tool 與不一致 route 在寫入 request 前回 `ROUTE_MISMATCH`。 | Unit/application 行為；不是 server authorization。 |
| Journey | `npm run test:day-27:journey` | `tests/integration/day-25-agent-journey.test.ts` | 搜尋、`detailUrl` 導覽、詳情與收藏在任一步無效時停止。 | adapter fake test double；不是 Agent planning。 |
| Server boundary | `npm run test:day-27:boundary` | `tests/server/demo-api.test.ts` | 缺少 session、偽造 `userId` 與未知活動都被拒絕，且收藏 state 不變。 | Demo API contract；不是 production security audit。 |
| Browser integration | `npm run test:day-27:browser` | `tests/browser/webmcp-runtime.spec.ts`, `tests/browser/day-24-tool-lifecycle.spec.ts`, `tests/browser/day-25-agent-journey.spec.ts`, `tests/browser/day-26-trusted-boundary.spec.ts` | 頁面註冊、lifecycle、journey 與 server-state UI evidence 保持連接。 | 安裝 test double 時只能證明 browser contract；絕非 native Agent proof。 |

## 單一重跑入口

`package.json` 將每個層級保留為可單獨診斷的 script，再以固定順序組合：

```text
test:day-27:contract
  → test:day-27:lifecycle
  → test:day-27:journey
  → test:day-27:boundary
  → test:day-27:browser
```

執行：

```powershell
npm run test:day-27
```

任一層失敗就停止，不會假裝後面的層也已通過。需要定位時，可直接執行對應的 `test:day-27:<layer>` script。

## 2026-07-21 實際結果

```text
test:day-27:contract   2 test files, 14 passed
test:day-27:lifecycle  2 test files, 13 passed
test:day-27:journey    1 test file,   7 passed
test:day-27:boundary   1 test file,  11 passed
test:day-27:browser    4 spec files, 12 passed

npm run test:day-27 -> exit code 0
Focused assertions executed: 57
```

## 這組測試不可以被誇大成什麼

Day 27 是一組最小回歸門檻，不是以測試數量為目標的全量測試宣告。

測試主動注入 document.modelContext 的案例，只能證明 adapter 與頁面 contract；不能寫成原生 Chrome、Inspector 或真實 Agent 已發現並呼叫 Tool。

Day 26 的 browser test 使用真實 Demo API，但仍不是 production security audit。

因此，Day 27 的通過代表：這個專案已選定的 contract、停止條件、route 範圍與 Demo API 拒絕規則仍能被重複驗證。它不代表任何特定 Agent host 已完成 discovery，也不替代真實 production 環境的資安評估。

## 完整品質 gate

建立 reader snapshot 前，除了 Day 27 focused gate，還必須執行：

```powershell
npm test
npm run test:browser
npm run typecheck
npm run build
```

2026-07-21 實際 gate：

```text
npm test              18 test files, 85 passed
npm run test:browser  19 passed
npm run typecheck     passed
npm run build         typecheck passed; Vite production build passed; 19 modules transformed
```

reader branch 與 tag 只能在上述命令全部 exit code 0 後建立。
