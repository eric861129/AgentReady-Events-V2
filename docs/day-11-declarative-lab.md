# Day 11：Declarative API Lab

## 本日新增的表單

`#declarative-search-lab` 是一個獨立的標準 HTML 表單，與 Day 13 才會決定的正式 `search_events` 沒有關係。它使用：

```html
<form
  toolname="search_events_lab"
  tooldescription="依關鍵字尋找公開活動。這是 Day 11 的宣告式練習，不是正式搜尋 Tool。"
>
  <input
    name="query"
    type="search"
    required
    toolparamdescription="用於比對公開活動的關鍵字。"
  />
</form>
```

在支援 WebMCP 的瀏覽器中，Declarative API 會從表單的 `toolname` 與 `tooldescription` 建立 Tool 描述，並從欄位推導輸入 schema。Agent 呼叫時，瀏覽器會聚焦並填入可見表單，使用者仍看得見流程。

## 這個 Demo 的誠實邊界

畫面上的「教學結構預覽」只將本 Lab 已知的欄位整理為 JSON Schema，方便對照 HTML 與預期結構。它不是 `getTools()` 的結果、不代表 Agent 已發現 Tool，也不會直接執行任何搜尋。

請在支援 WebMCP 的 Chrome 環境，以 Inspector 或 `document.modelContext.getTools()` 另行確認真實註冊狀態；Playwright 的一般測試只驗證 HTML 標註和不誤導使用者的預覽文案。
