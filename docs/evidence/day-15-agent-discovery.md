# Day 15 Agent Discovery Evidence

此文件是 Day 15 的原生 Agent 手動驗證證據模板。請在實際驗證後填寫；不得以猜測或預期結果替代 Gemini 或 Inspector 的實際觀察，也不得在此文件記錄、洩漏或要求任何 API key。

## Environment

- Branch: `day-15-agent-discovery`
- Commit: `260b0649257c3418fbdf2fd6db252b109b67a68c`
- Chrome full version: 待使用者於 `chrome://version` 手動補錄；本操作環境封鎖 `chrome://` URL，不能以推測版本替代。
- Chrome flag `#enable-webmcp-testing`: 未確認；實測 `document.modelContext` 不可用。
- Inspector extension version: 未安裝／未驗證；因原生 API 不可用，沒有可供 Inspector 探索的 Tool。
- Gemini model selected in Inspector: 未使用；因原生 API 不可用，未進入 Agent discovery。
- Local URL: `http://127.0.0.1:4174/`（本機 Vite，正式 `day-15-agent-discovery` 讀者快照）

環境界線：Playwright 是自動化瀏覽器執行環境；Chrome flag 控制 WebMCP 測試功能；Inspector 是 Chrome 擴充功能；Gemini 則僅在 Inspector 的本機模型執行環境中運作。若 Gemini 模式需要使用者本機設定的 API key，僅確認「已在本機設定」即可，絕不記錄其值或要求提供。

## Prompt

```text
請幫我找一場前端活動，告訴我日期與地點。
```

此 prompt 刻意不提及 Tool name、parameter names，也不使用 `invoke`、`call` 等 action verbs。請維持逐字相同的 prompt，不得為了強迫工具使用而改寫。

## Expected Observation

- Agent 能探索到 `search_events`。
- 使用者請求為活動搜尋時，Agent 會選取 `search_events`。
- 若 Gemini 未選取該 Tool，必須如實記錄為有效的失敗證據；不得改寫 prompt 以強迫使用工具。

## Actual Observation

- 驗證日期與時間：2026-07-18 13:47:51 +08:00。
- 是否可於 Inspector 中看到 `search_events`：未進入 Inspector；實際 Chrome 頁面顯示 `document.modelContext 不可用`、無法註冊 Tool、尚未觀測到 Tool。
- Gemini 是否選取 `search_events`：未測試；原生 API 未提供，沒有可讓 Agent 探索或選取的 Tool。未以改寫 prompt 或 test double 強迫結果。
- 回覆中的日期與地點：無；未發送 Agent prompt。
- 實際行為與預期不一致之處：這個 Chrome runtime 未提供 `document.modelContext`，因此「已註冊、可被 Inspector 發現」的前置條件不成立。
- 結論：這是實際 Chrome 的不支援證據，不是成功 discovery，也不是 Playwright browser test double。原生 Inspector／Gemini 證據仍為 pending，須改在支援 WebMCP 的 Chrome 與 Inspector 環境重做。

## Screenshots

- 實際 Chrome 不支援畫面：`WEBMCP-iThome-2026-Draft-V2/assets/day-15/runtime-native-chrome-unsupported.png`。
- Inspector 顯示已註冊工具的截圖：未取得；原生 API 不可用，未安裝／操作 Inspector 來冒充結果。
- Gemini 回覆／未選取工具的截圖：未取得；未發送 prompt，因前置條件不成立。
- Chrome flags 與版本截圖（如適用）：待使用者於 `chrome://version` 手動補錄；目前已明確保留原因。

請在每一項後填入可追溯的檔案路徑或連結；沒有截圖時明確標示原因。

## Notes

- Gemini 未選取 Tool 並不代表測試無效，而是本次真實 Agent 行為的有效失敗證據。
- 請分別記錄 Playwright、Chrome flag、Inspector 與 Gemini 本機 key runtime 的狀態，勿將其中一層的結果推論為另一層已成功。
- 不得在此文件放入 API key、token、帳密或其他敏感資料。
