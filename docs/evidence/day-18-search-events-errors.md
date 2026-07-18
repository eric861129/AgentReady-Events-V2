# Day 18 Error Handling Evidence

本文件記錄 `search_events` 三種錯誤回應的 Inspector 驗證輸入與受控 browser test 範圍。以下均為直接 Inspector calls 的證據規格；尚未取得原生 Inspector 手動擷取結果前，不得以預期值或 browser test double 輸出宣稱已完成原生驗證。

## INVALID_ARGUMENT

在 Inspector 直接呼叫 `search_events`，輸入如下：

```json
{
  "query": ""
}
```

預期 raw result 的 `errorCode` 為 `INVALID_ARGUMENT`。此案例驗證空白查詢會被拒絕，並回傳可供修正輸入的 guidance。

## NO_RESULTS

在 Inspector 直接呼叫 `search_events`，輸入如下：

```json
{
  "query": "不存在的活動"
}
```

預期 raw result 的 `errorCode` 為 `NO_RESULTS`。此案例表示輸入有效，但沒有符合條件的活動。

## TEMPORARY_UNAVAILABLE

在 Inspector 直接呼叫 `search_events`，輸入如下：

```json
{
  "query": "前端"
}
```

要擷取 `TEMPORARY_UNAVAILABLE`，必須使用下列本機網址開啟受控情境：

```text
http://127.0.0.1:4173/?evidenceScenario=temporary-unavailable
```

這是僅限本機開發的**受控暫時失敗**，用來驗證 Tool 的錯誤回應與 Inspector 顯示；它不是實際 production outage，也不代表正式環境發生服務中斷。預期 raw result 的 `errorCode` 為 `TEMPORARY_UNAVAILABLE`。

## Why These Are Direct Inspector Calls

三個案例都是對 `search_events` 的 direct Inspector calls：Inspector 以指定 JSON input 直接執行 Tool，並檢查 raw result。它們不是 Agent 對話結果，不能描述為 Agent 已理解、選擇或推薦活動的證據。

自動化 browser test 也只注入支援的 `document.modelContext` test double，按下「用瀏覽器 API 驗證」後檢查證據面板的 raw result；它用來覆蓋受控情境，不取代原生 Inspector 的手動觀測。

## Actual Chrome Unsupported Capture

- 驗證日期與時間：2026-07-18 13:47:51 +08:00。
- 正式讀者快照：`day-18-search-events-errors`，commit `7a1654c77667a1dbd4172cac25147b7b2121c171`。
- 實際本機 URL：`http://127.0.0.1:4176/?evidenceScenario=temporary-unavailable`。
- Chrome full version：待使用者於 `chrome://version` 手動補錄；本操作環境封鎖 `chrome://` URL，不能以推測版本替代。
- 原生觀測：`document.modelContext` 不可用，頁面無法註冊 Tool，亦未觀測到 Tool。
- 三個 direct Inspector calls：均未執行。原生 Tool 尚未註冊，因此不得捏造 `INVALID_ARGUMENT`、`NO_RESULTS` 或 `TEMPORARY_UNAVAILABLE` 的 raw result。
- 受控 temporary-unavailable URL 的結果：頁面未出現 `TEMPORARY_UNAVAILABLE`；這是因為 native runtime 的前置條件先失敗，並非正式服務可用性結論。
- 截圖：`WEBMCP-iThome-2026-Draft-V2/assets/day-18/runtime-native-chrome-unsupported.png`。

這筆資料是實際 Chrome 的不支援證據，不是 browser test double，也不取代日後於支援 WebMCP 的 Chrome Inspector 中擷取的錯誤結果。
