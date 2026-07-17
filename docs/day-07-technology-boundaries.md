# Day 7：WebMCP、MCP、REST API、Browser Automation 的工作邊界

用同一個「替我找前端活動」任務，比較四種技術的位置，而不是比較誰比較新或比較厲害。

| 技術 | 誰連到誰 | 主要依據 | 在活動網站的角色 |
|---|---|---|---|
| Browser Automation | 自動化程式 → 瀏覽器 UI | DOM、無障礙樹、畫面與 Locator | 填搜尋框、按按鈕、讀取卡片；適合 E2E 測試與既有網站操作。 |
| REST API | 用戶端或服務 → 伺服器 | HTTP endpoint、資料 contract、授權 | 取得或修改後端資料；不是讓目前網頁向 Agent 解釋 UI 能力的介面。 |
| MCP | Agent host → MCP server | MCP transport 與 Tool schema | 讓 Agent 連外部系統或服務；server 可以在網站之外。 |
| WebMCP | Agent／瀏覽器 → 目前網頁 | 網頁宣告的 Tool schema 與瀏覽器權限 | 讓目前開啟的網站揭露前端能力與當前情境。 |

## 不可互相取代的原因

- WebMCP 不取代 REST API：活動資料仍可由 REST API 或其他後端介面提供；WebMCP 描述的是頁面此刻願意提供給 Agent 的操作。
- WebMCP 不取代 MCP：MCP server 處理跨系統連線與 server-side 能力；WebMCP 把能力放在網頁和瀏覽器的共同情境中。
- WebMCP 不讓 Browser Automation 消失：E2E 測試仍需檢查人類 UI；Day 5 的實驗只證明一個依賴文案的 Locator 對文案敏感。

## 本日結論

先問「Agent 需要和哪一層合作」，再選技術。當 Agent 要在使用者正開啟的活動網站中理解一個能力，WebMCP 是候選；若要驗證人類 UI 仍正常，Playwright 仍然是正確工具。
