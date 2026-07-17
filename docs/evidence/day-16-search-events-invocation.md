# Day 16 Search Events Invocation Evidence

此文件是 Day 16 的原生 Inspector 手動驗證證據模板。請在實際驗證後填寫；不得將 Playwright browser test double 的結果、預期輸出或推測內容當作原生 Inspector 觀測。

## Environment

- Branch: `day-16-search-events-invocation`
- Commit:
- Chrome full version:
- Chrome flag `#enable-webmcp-testing`: enabled
- Inspector extension version:
- Gemini model selected in Inspector:
- Local URL:

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

- 驗證日期與時間：
- Inspector 是否可看到 `search_events`：
- 實際 invocation input：
- 實際 raw result（完整 JSON）：
- `status`：
- `appliedFilters`：
- `results`：
- 實際行為與預期不一致之處：
- 結論：待實際原生 Inspector 手動驗證填寫。

## Screenshots

- Inspector invocation：`../WEBMCP-iThome-2026-Draft-V2/assets/day-16/inspector-invocation.png`
- App runtime panel：`../WEBMCP-iThome-2026-Draft-V2/assets/day-16/app-runtime-panel.png`

請在實際取得截圖後確認路徑可追溯；尚未取得時，這兩項僅為預定手動擷取位置，並不表示已有原生觀測證據。

## Notes

- 此驗證為 Inspector 對 `search_events` 的直接 invocation，不是 AI Agent 對話行為的證據。
- 不得在此文件放入 API key、token、帳密或其他敏感資料。
