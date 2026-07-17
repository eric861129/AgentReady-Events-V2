# Day 10：Declarative API 與 Imperative API，何時各自適合

WebMCP 不是兩套競爭的 API；它們適合不同形狀的網頁能力。

| 問題 | Declarative API | Imperative API |
|---|---|---|
| 入口 | 已存在的標準 HTML `<form>` | `document.modelContext.registerTool()` |
| 適合的能力 | 穩定、可預先描述、以表單欄位收集輸入 | 依目前畫面、資料或使用者情境動態決定 |
| schema 來源 | 瀏覽器從 `toolname`、`tooldescription` 與表單欄位合成 | 開發者提供 `name`、`description`、`inputSchema` 與 `execute` |
| 執行模型 | 瀏覽器聚焦並填入可見表單，使用者仍看得到流程 | 頁面程式執行既有邏輯，可在條件改變時註冊或解除註冊 |
| 本系列 Lab | Day 11 的 `search_events_lab` | Day 12 的 `get_current_event_lab` |

## 決策問題

1. 這個能力能否完整表達為可見表單的欄位與送出流程？若可以，先選 Declarative API。
2. 能力是否只在某個活動詳情、登入身分或暫態頁面狀態下成立？若是，選 Imperative API。
3. 是否需要在 Tool 存在期間重用前端程式邏輯並回傳結構化結果？若需要，選 Imperative API。

## 目前 API 名稱與版本風險

查核日期為 2026-07-17。Chrome 的 [Imperative API 文件](https://developer.chrome.com/docs/ai/webmcp/imperative-api) 指出，`navigator.modelContext` 已於 Chrome 150 淘汰，應使用 `document.modelContext`。本專案因此只使用後者，並在瀏覽器未提供 API 時顯示不支援狀態，不使用 polyfill 偽裝成功。

Day 11 先用最小表單驗證 Declarative API；Day 12 再用目前詳情對話框示範 Imperative Tool 的生命週期。
