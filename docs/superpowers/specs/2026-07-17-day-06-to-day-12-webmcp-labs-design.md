# Day 6–12 WebMCP Labs 設計

## 目標

讓讀者在不提前實作 Day 13 正式 `search_events` 的前提下，完成從概念、Tool 規格與選型，到兩種 WebMCP API 實驗室的連續學習路徑。

## 已核准的範圍

- Day 6–10 只增加可重用的文章材料與概念對照，不將正式 Demo 的搜尋操作註冊為 Tool。
- Day 11 建立獨立的 `search_events_lab` 宣告式表單；它是練習工具，名稱與 Day 13 的正式 `search_events` 明確不同。
- Day 12 在既有「查看詳情」對話框開啟期間，示範 Imperative Tool 的註冊與解除註冊；不提早引入 Day 24 才會處理的路由。
- Day 6、11、12 分別產生可用於文章的實際 Demo 截圖；其餘概念日提供可直接引用的 Markdown 表格與規格卡。
- 每日完成後建立不可回寫的 `day-XX-*` 分支與對應 `v0.1.0-day-XX` tag。

## WebMCP 整合策略

正式整合以目前官方文件的 `document.modelContext` 為唯一瀏覽器 API；不使用已淘汰的 `navigator.modelContext`。宣告式 Lab 使用具有 `toolname`、`tooldescription` 與 `toolparamdescription` 的標準 HTML `<form>`。命令式 Lab 使用 `registerTool()` 與 `AbortController`，讓 Tool 的存續時間精準對應詳情對話框是否開啟。

## 不支援瀏覽器的誠實呈現

Playwright 的測試瀏覽器與讀者本機瀏覽器未必提供 WebMCP。程式會先檢查 `document.modelContext`：

- 支援時：讀取瀏覽器的 `getTools()` 結果，並讓 Imperative Lab 真正呼叫 `registerTool()`。
- 不支援時：顯示「此瀏覽器未提供 WebMCP」；Declarative Lab 僅展示依 HTML 屬性產生的**教學結構預覽**，而不是宣稱 Agent 已發現或呼叫 Tool。

此預覽是為了讓文章可以展示 `<form>` 與 JSON Schema 的對應；它不模擬 Agent、不直接執行 Tool，也不取代支援 WebMCP 的瀏覽器驗證。

## 模組邊界

| 模組 | 責任 |
|---|---|
| `src/webmcp/types.ts` | 宣告目前草案所需的最小瀏覽器型別，不引入 polyfill。 |
| `src/webmcp/support.ts` | 偵測 `document.modelContext`，並安全讀取真實可用 Tool。 |
| `src/labs/declarative-preview.ts` | 從已標註的表單欄位產生明確標示為預覽的結構資料。 |
| `src/labs/current-event-tool.ts` | 建立及管理目前選取活動的 Imperative Tool 註冊生命週期。 |
| `src/main.ts` | 渲染文章用概念卡與兩個 Lab，並把對話框狀態交給生命週期管理器。 |

## 驗證策略

- 純函式與生命週期管理器以 Vitest 先寫失敗測試，再完成最小實作。
- Browser test 驗證 Day 11 標註表單、Day 12 詳情開啟／關閉時可見的真實狀態訊息；在不支援的 Playwright 瀏覽器中，預期顯示不支援提示，不能冒充 Tool discovery。
- 以受控的 Vite server 執行 Playwright；保留 Day 5 的預期失敗實驗，且不將它列入一般成功測試。
- 截圖由實際執行的 Demo 擷取到 Draft V2 的 `assets/day-06`、`assets/day-11` 與 `assets/day-12`。

## 非目標

- 不改寫 Day 1–5 快照。
- 不建立 MCP server、REST API 或 Agent runtime。
- 不執行正式 `search_events` Tool、活動收藏、報名、付款或任何高風險寫入。
- 不使用假 Model Context、假 Agent discovery 或假 invocation 作為文章證據。
