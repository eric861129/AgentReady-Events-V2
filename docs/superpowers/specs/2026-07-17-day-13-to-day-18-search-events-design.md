# Day 13–18：正式 `search_events` Tool 設計

## 目標

將活動網站的既有搜尋能力，做成一項低風險、唯讀、可由瀏覽器 Agent 發現與呼叫的正式 WebMCP Tool。這六天必須保留三種不同層次的證據：網站確實註冊 Tool、Agent 確實看見並選擇 Tool、Tool 確實以結構化資料完成或拒絕一次呼叫。

正式驗證使用 Chrome 的 `document.modelContext` 與官方 Model Context Tool Inspector。Chrome 的 WebMCP 測試旗標與 Gemini API Key 只存在於本機 Chrome；API Key 不寫入程式碼、Git、文件截圖或測試輸出。

## 範圍與非目標

### 範圍

- 正式 Tool 名稱為 `search_events`，只讀取活動資料，不寫入收藏、報名或任何使用者狀態。
- 搜尋頁啟動後註冊一個原生 Imperative Tool；Day 11 的 `search_events_lab` 與 Day 12 的 `get_current_event_lab` 繼續保留為教學 Lab。
- Tool 以固定提示驗證 Agent 的自然語言選擇，提示中不得直接出現 `search_events`。
- 固定保留成功、輸入不合法、查無資料與受控暫時失敗的原始呼叫紀錄。

### 非目標

- 不新增活動詳情 Tool、路由生命週期、收藏或報名流程；這些屬於後續天數。
- 不加入 polyfill、假 Agent、假 discovery 或假 invocation；不支援 WebMCP 的瀏覽器必須清楚顯示未完成原生驗證。
- 不把一次 Gemini 成功泛化成所有模型或所有瀏覽器均能正確選擇 Tool。

## Tool 契約

### 輸入

`query` 是必要的非空字串；`category` 與 `date` 是可選的精確篩選條件。

```json
{
  "query": "前端",
  "category": "前端",
  "date": "2026-08-08"
}
```

`category` 僅接受既有活動分類：`前端`、`後端`、`產品`、`社群`。`date` 必須是 `YYYY-MM-DD` 且為真實日曆日期。輸入在進入既有搜尋邏輯前完成驗證；UI 與 Tool 將共用同一份搜尋 use case，而非各自實作篩選規則。

### 成功結果

WebMCP callback 回傳可解析的 JSON 字串；其邏輯內容固定如下，以便 Agent 與文章讀者都能辨識結果邊界。

```json
{
  "status": "ok",
  "appliedFilters": {
    "query": "前端",
    "category": "前端",
    "date": "2026-08-08"
  },
  "results": [
    {
      "eventId": "event-frontend-summit",
      "title": "前端體驗設計小聚",
      "category": "前端",
      "date": "2026-08-08",
      "location": "台北市信義區",
      "summary": "從語意、效能到互動細節，重新檢視網頁體驗。"
    }
  ]
}
```

結果刻意不回傳內部實作欄位，也不提早承諾尚未存在的詳情 URL 或下一個 Tool。

### 錯誤結果

所有預期失敗都回傳 `status: "error"`，並提供 `errorCode`、可閱讀的 `message` 與下一步 `guidance`。錯誤不以空陣列、未處理例外或猜測性成功代替。

```json
{
  "status": "error",
  "errorCode": "INVALID_ARGUMENT",
  "message": "搜尋活動需要有效的 query。",
  "guidance": "請提供非空白 query 後再試一次。"
}
```

| 情況 | errorCode | guidance |
| --- | --- | --- |
| 欄位遺漏、分類無效、日期格式或日期值無效 | `INVALID_ARGUMENT` | 指出可接受格式或值，請 Agent 修正輸入。 |
| 查詢完成但沒有符合資料 | `NO_RESULTS` | 建議放寬或更換關鍵字；不要求盲目重試。 |
| 搜尋資料來源暫時不可用 | `TEMPORARY_UNAVAILABLE` | 說明可稍後重試，並不宣稱已找到資料。 |

為了讓 Day 18 可重現，暫時失敗將由僅限 Vite 開發模式的 `evidenceScenario=temporary-unavailable` 注入。它不是 Tool 參數，也不會出現在正式建置；所有文章與截圖必須標示為「受控暫時失敗」，不能假稱真實線上事故。

## 元件與資料流

1. `filterEvents` 是人類 UI 與 Tool 共用的搜尋 use case，接收輸入後套用 query、category、date 篩選；Tool 再將 `EventItem` 映射為公開結果。
2. `SearchEventsTool` 將 use case 包裝成符合 `document.modelContext.registerTool()` 的正式定義，保留 `readOnlyHint: true`。
3. `SearchEventsToolLifecycle` 負責頁面載入時註冊與頁面卸載時 abort；不得覆蓋或取消 Day 12 Lab 的生命週期。
4. `webmcp/types.ts` 補齊 Chrome 所用的 `getTools()`、`executeTool()` 與 Tool 摘要型別，僅作為原生 API 的 TypeScript 描述，不實作後備 runtime。
5. 開發中的觀測區顯示原生可用性、註冊後讀到的 Tool 摘要、最近一次 Tool 呼叫的輸入與原始回傳。它是可觀察性介面，不是 Agent 模擬器。

在未提供 `document.modelContext` 的瀏覽器，網站仍可供人類搜尋，但觀測區必須明說「未提供 WebMCP；未發生原生註冊、discovery 或 invocation」。

## Agent 與原生證據

原生瀏覽器驗證固定使用 Chrome 150、啟用 `chrome://flags/#enable-webmcp-testing`，並透過官方 Model Context Tool Inspector 操作。驗證紀錄必須至少含有瀏覽器完整版本、旗標狀態、Inspector 版本、Gemini 模型名稱、固定提示、當下 Git branch 與 commit。

Day 15 的固定提示為「請幫我找一場前端活動，告訴我日期與地點。」提示不含 Tool 名稱、欄位名稱或任何操作提示。可接受結果是 Agent 選擇 `search_events`、傳入符合 schema 的參數，並依 Tool 結果回答；若模型沒有選擇 Tool，該紀錄是有效的失敗證據，不能改 prompt 偷渡答案。

Day 16 以 Inspector 產生的實際 invocation 記錄驗證輸入、執行、原始回傳與最終回答。Day 17 以同一條成功路徑檢查結果每一欄是否支持回答且不洩漏內部資料。Day 18 的三種錯誤使用 Inspector 的直接 Tool 呼叫保存結果；這是 schema／錯誤契約驗證，不冒充 Agent 的自主選擇。

## 測試與快照

每項行為依序執行 RED、最小實作、GREEN：

- Vitest：輸入驗證、篩選 use case、公開結果映射、三種錯誤與受控暫時失敗。
- Playwright：人類搜尋 UI 未被正式 Tool 改壞、原生 API 缺席時的誠實提示，以及可重現的觀測區內容。
- Chrome 原生人工驗證：註冊、discovery、Gemini 選擇、invocation、成功結果與三種錯誤的原始紀錄與截圖。

每日完成後建立對應讀者 branch 與 tag：

| Day | branch | tag | 主要證據 |
| --- | --- | --- | --- |
| 13 | `day-13-search-events-contract` | `v0.1.0-day-13` | 正式 contract、輸入與錯誤矩陣。 |
| 14 | `day-14-search-events-declaration` | `v0.1.0-day-14` | Chrome 原生註冊與 Tool 摘要。 |
| 15 | `day-15-agent-discovery` | `v0.1.0-day-15` | 未暗示 Tool 名稱的 Gemini discovery 紀錄。 |
| 16 | `day-16-search-events-invocation` | `v0.1.0-day-16` | 成功 invocation、原始回傳與最終回答。 |
| 17 | `day-17-search-events-result` | `v0.1.0-day-17` | 結果欄位取捨與 Agent 回答對照。 |
| 18 | `day-18-search-events-errors` | `v0.1.0-day-18` | 三種可行動錯誤紀錄。 |

## 驗收條件

- 標準測試全部通過，Day 5 的文字改名失敗實驗仍獨立存在且不被改寫。
- Tool 註冊、discovery 與 invocation 均可在啟用旗標的 Chrome 中實際完成；不支援環境不會產生誤導性的成功訊息。
- 任何文章中的「Agent 選擇」均附有未暗示 Tool 名稱的原始紀錄；沒有成功時如實記錄限制。
- 截圖、原始紀錄、每日 branch、tag 與 `docs/versioning.md` 指向同一 commit。
