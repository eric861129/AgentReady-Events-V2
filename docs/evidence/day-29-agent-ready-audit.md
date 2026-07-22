# Day 29｜這個活動網站，現在算 Agent-ready 了嗎？

> 稽核日期：2026-07-21（Asia/Taipei）<br>
> 稽核範圍：Day 13–28 的正式 Tool contract、可重跑測試、Demo API 與 native Chrome 觀察。<br>
> 判讀原則：**正式 Tool、unit／integration、browser test double、真實 Demo API 與 native Chrome observation 不能互相替代。**

## 先給結論

這個專案可以稱為一個**有界、可驗證的 Agent-ready Demo**：它已把活動搜尋、詳情導覽與收藏的能力整理成 Tool contract，並對輸入、輸出、route、UI 同步、錯誤與 Demo API session 邊界留下可重跑證據。

它還不能稱為「已在真實 Agent／原生 WebMCP runtime 驗證完成」的網站，更不能稱為 production-ready。實際 Chrome 觀察時 `document.modelContext` 不可用；因此沒有原生 discovery、Agent 選 Tool 或原生 invocation 的成功證據。這個缺口要明確保留，不能用 browser test double 補上。

## 判讀標記

| 標記 | 意義 |
|---|---|
| 已驗證：正式契約／直接呼叫 | 正式 production source 的 Tool 被直接測試或執行；不代表 Agent 已選取它。 |
| 已驗證：browser test double | 驗證頁面整合、Tool lifecycle、transport input/output 與 UI；不代表原生 Inspector 或 Agent。 |
| 已驗證：Demo API | 真實瀏覽器與同源 Demo API/session 的行為已驗證；不代表 production auth 或資安稽核。 |
| 未驗證：原生 runtime | 本輪無法取得 native Chrome／Agent 成功證據，或實測為不支援。 |

## 證據矩陣

| 主張 | 驗證方式與來源 | 結果 | 限制與不可宣稱事項 |
|---|---|---|---|
| 網站能以結構化 contract 描述公開活動搜尋能力 | `src/webmcp/search-events-tool.ts` 的正式 `createSearchEventsTool`；[`tests/search-events-webmcp-tool.test.ts`](../../tests/search-events-webmcp-tool.test.ts) 驗證名稱、描述、schema、read-only hint 與成功／錯誤 JSON。 | **已驗證：正式契約。** `search_events` 接受 `query`，成功結果含 canonical `eventId` 與 `detailUrl`。 | 不代表原生 runtime 已註冊、被 discovery，或被模型選取。 |
| 相同搜尋查詢可直接取得結構化活動結果 | [`tests/day-28-search-events-tool.test.ts`](../../tests/day-28-search-events-tool.test.ts) 與 [Day 28 raw Tool JSON](assets/day-28-tool-result.json) 直接執行正式 Tool。 | **已驗證：正式契約／直接呼叫。** `{ "query": "前端" }` 回傳 `event-frontend-summit`。 | 呼叫者是 test process，不是原生 Agent 或模型。 |
| Tool 錯誤具有可辨識的 contract | Day 17／18 的成功與錯誤證據；[`tests/search-events-webmcp-tool.test.ts`](../../tests/search-events-webmcp-tool.test.ts) 驗證 `INVALID_ARGUMENT`；[Day 18 證據](day-18-search-events-errors.md) 區分受控錯誤。 | **已驗證：正式契約／受控測試。** 錯誤透過 `errorCode` 表達，而非只依賴畫面文案。 | Day 18 的 browser runtime 畫面屬 test evidence；沒有 native Agent 在原生 runtime 收到錯誤的證據。 |
| 路由不同時，網站會提供相符的 Tool，且舊 Tool 不可沿用 | [Day 24 lifecycle 證據](day-24-tool-lifecycle.md)、[`tests/webmcp/current-event-tool-lifecycle.test.ts`](../../tests/webmcp/current-event-tool-lifecycle.test.ts) 與 Day 24 browser test。 | **已驗證：unit／integration 與 browser test double。** 搜尋結果的 `detailUrl` 導向詳情 route；切換 route 後舊 handler 失效。 | 不代表原生 Agent 已在實際瀏覽器完成 route-aware discovery。 |
| 搜尋→詳情→收藏可完成單一任務旅程 | [Day 25 journey 證據](day-25-agent-journey.md)、[`tests/integration/day-25-agent-journey.test.ts`](../../tests/integration/day-25-agent-journey.test.ts) 與 browser attachment。 | **已驗證：integration／browser test double。** 可記錄 `search_events`、`get_event_details`、`save_event` 的輸入輸出、導覽與停止條件。 | Harness／browser test double 不是真實 Agent session；不證明模型能理解自然語言、自己規劃或可靠選 Tool。 |
| 收藏結果會以伺服端狀態同步至 UI | [Day 22 UI state 證據](day-22-visible-tool-state.md)、[`tests/browser/day-22-visible-state.spec.ts`](../../tests/browser/day-22-visible-state.spec.ts)。 | **已驗證：Demo API。** 人類 UI 的收藏、重載、取消與復原會依同源 API/session 狀態呈現。 | UI 同步不等於 Tool 已被原生 Agent 呼叫；資料僅存在 Demo API memory。 |
| 收藏寫入不相信前端 user ID 或 DOM 畫面 | [Day 26 trusted boundary 證據](day-26-trusted-boundary.md)、[`tests/server/demo-api.test.ts`](../../tests/server/demo-api.test.ts) 與 Day 26 browser test。 | **已驗證：Demo API。** 無／失效 session 回 `UNAUTHENTICATED`；偽造 `userId` 回 `UNEXPECTED_IDENTITY_FIELD`；未知活動回 `EVENT_NOT_FOUND`，且收藏集合不變。 | 僅有 `demo-reader`、in-memory session／收藏；沒有 database、OAuth、password、完整 RBAC 或 production security audit。 |
| UI 按鈕改名不會改變 Tool contract | [Day 28 對照證據](day-28-button-copy-comparison.md)、[Playwright 預期失敗輸出](assets/day-28-day-05-failure.txt)、[並列截圖](assets/day-28-button-copy-comparison.png)。 | **已驗證：UI 對照 + 正式 Tool 直接呼叫。** Day 5 精確 locator 找不到「搜尋活動」；相同 query 的 Tool 仍回傳 `event-frontend-summit`。 | 不代表 WebMCP 取代 UI 測試；可見文案、使用者操作與版面仍要由 UI tests 保護。 |
| 系列的驗證可重複執行 | [Day 27 test strategy](day-27-test-strategy.md) 與 `npm run test:day-27`、`npm run test:day-28`。 | **已驗證：自動化測試策略。** contract、lifecycle、journey、server boundary、browser 與 Day 28 對照都有固定入口。 | 自動化可重跑不會自動升格為 native Agent 或 production 證據。 |
| 原生 Chrome 能 discovery／invoke WebMCP Tool | [Day 13–18 runtime matrix](runtime-matrix-day-13-to-day-18.md) 的 2026-07-18 實際 Chrome 觀察；Day 15、16、18 readers 均顯示 `document.modelContext` 不可用。 | **未驗證：原生 runtime。** 本輪觀察結果是 browser 不支援，沒有捏造 Inspector／Gemini 結果。 | 不能宣稱 Inspector、Gemini 或任何真實 Agent 已發現、選擇或呼叫本 Demo 的 Tool。 |

## 已知限制清單

1. **原生 WebMCP runtime 未驗證成功。** 實際 Chrome 觀察到 `document.modelContext` 不可用；Chrome version 與 flag 組合若改變，必須重新觀察並保存原始畫面，不能沿用 test double 結論。
2. **沒有真實 Agent 行為證據。** 未驗證模型如何理解自然語言、選擇 Tool、處理多輪澄清、拒絕不安全請求或面對模糊意圖。
3. **任務範圍刻意很小。** 只覆蓋活動搜尋、單一詳情 route 與收藏；沒有報名、付款、取消、個資、跨帳號或其他高風險副作用流程。
4. **授權邊界只是一個最小 Demo。** `demo-reader`、HttpOnly cookie 與 in-memory state 足以說明「不要相信前端 identity」，但不構成帳號系統、持久化資料、權限模型或資安稽核。
5. **Tool contract 不保證 UI 不會壞。** Day 28 只證明這一個查詢 Tool 不依賴該按鈕文案；UI flow、可及性、設計變動與人類操作仍需 Playwright 等 UI 自動化。
6. **沒有 production operating evidence。** 未做部署、可用性、效能／壓力、監控、併發、資料遷移、rate limiting、audit log 或 disaster recovery 驗證。
7. **資料集與語意有限。** Demo catalog 固定且規模小；結果不能推論到大型即時資料、權限過濾、推薦品質或跨語言搜尋。

## Day 29 對外文章的安全結論

可以寫：

> 這個網站已在一個受限 Demo 範圍內，將可被 Agent 使用的能力整理成可讀、可呼叫、可測試的 contract；並驗證了 route、寫入邊界、UI 同步與 UI 改名對照。

不能寫：

> 這個網站已證明任何 AI Agent 都能可靠操作，也已具備 production 級安全、授權與跨瀏覽器 WebMCP 支援。

Day 30 應以本文件的「已驗證」與「未驗證」欄作為 30 天總結的事實基線。
