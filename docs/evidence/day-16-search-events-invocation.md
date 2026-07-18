# Day 16 Search Events Invocation Evidence

此文件是 Day 16 的原生 Inspector 手動驗證證據模板。請在實際驗證後填寫；不得將 Playwright browser test double 的結果、預期輸出或推測內容當作原生 Inspector 觀測。

## Environment

- Branch: `day-16-search-events-invocation`
- Commit: `1d33827bb23624600006264d8d5483c0ea7625be`
- Chrome full version: 待使用者於 `chrome://version` 手動補錄；本操作環境封鎖 `chrome://` URL，不能以推測版本替代。
- Chrome flag `#enable-webmcp-testing`: 未確認；實測 `document.modelContext` 不可用。
- Inspector extension version: 未安裝／未驗證；因原生 API 不可用，沒有可供 Inspector 呼叫的 Tool。
- Gemini model selected in Inspector: 不適用；本篇驗證目標是 direct Inspector invocation，非 Agent 對話。
- Local URL: `http://127.0.0.1:4175/`（本機 Vite，正式 `day-16-search-events-invocation` 讀者快照）

環境界線：Playwright 是自動化瀏覽器執行環境；Chrome flag 控制 WebMCP 測試功能；Inspector 是 Chrome 擴充功能；Gemini 則僅在 Inspector 的本機模型執行環境中運作。若 Gemini 模式需要使用者本機設定的 API key，僅確認「已在本機設定」即可，絕不記錄其值或要求提供。

## Direct Inspector Invocation Input

```json
{
  "query": "前端"
}
```

## Expected Raw Result Shape

```json
{
  "status": "ok",
  "appliedFilters": {
    "query": "前端"
  },
  "results": [
    {
      "eventId": "string",
      "title": "string",
      "category": "string",
      "date": "YYYY-MM-DD",
      "location": "string",
      "summary": "string"
    }
  ]
}
```

這是契約的預期 shape，不是已取得的原生執行結果；原生 Inspector 實際結果應填入下列欄位。

## Actual Manual Capture

- 驗證日期與時間：2026-07-18 13:47:51 +08:00。
- Inspector 是否可看到 `search_events`：未進入 Inspector；實際 Chrome 頁面顯示 `document.modelContext 不可用`、無法註冊 Tool、尚未觀測到 Tool。
- 實際 invocation input：未執行。雖然預定 input 為 `{ "query": "前端" }`，但沒有已註冊的原生 Tool 可供 Inspector 呼叫。
- 實際 raw result（完整 JSON）：未取得；不得以預期 shape 或 browser test double 結果補寫。
- `status`：不適用。
- `appliedFilters`：不適用。
- `results`：不適用。
- 實際行為與預期不一致之處：這個 Chrome runtime 未提供 `document.modelContext`，所以 direct Inspector invocation 的前置條件未成立。
- 結論：本次補的是實際 Chrome 不支援證據，而不是原生 invocation 成功證據。原生 Inspector capture 仍須在支援環境完成。

## Screenshots

- Inspector invocation 的 canonical pending asset、外部素材資料夾界線與 mirror 關係，請依 [Day 16 manual capture asset manifest](day-16-manual-capture-assets.md) 交接。
- 實際 Chrome 不支援畫面：`WEBMCP-iThome-2026-Draft-V2/assets/day-16/runtime-native-chrome-unsupported.png`。它僅記錄原生 API 不可用，不代表 Inspector 已呼叫 Tool。

目前尚未取得原生 Inspector 或 Gemini Agent 證據；不得以 placeholder、Playwright browser test double 或預期輸出替代原生觀測。

## Notes

- 此驗證為 Inspector 對 `search_events` 的直接 invocation，不是 AI Agent 對話行為的證據。
- 不得在此文件放入 API key、token、帳密或其他敏感資料。
