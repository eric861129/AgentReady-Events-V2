# Day 17 Search Events Result Evidence

此文件是 Day 17 的原生 Inspector 手動驗證證據模板。下表說明正式回應契約；不得以預期值或 browser test double 輸出宣稱已完成原生 Inspector 驗證。

## Result Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `eventId` | string | 活動的穩定識別碼，供回應結果識別使用。 |
| `title` | string | 活動標題。 |
| `category` | string | 活動分類。 |
| `date` | string | 活動日期，格式為 `YYYY-MM-DD`。 |
| `location` | string | 活動地點。 |
| `summary` | string | 可供 Agent 摘要或推薦時使用的活動摘要。 |

## Capability Boundary

此回應刻意不暴露活動 detail URL，也不提供任何 mutation capability；`search_events` 僅回傳核准的唯讀搜尋結果欄位。

## Native Inspector Manual Result

請在原生 Inspector 實際執行完成後，將擷取到的完整 JSON 貼入此區塊。尚未手動驗證前請保留空白，勿填入預期值或 browser test double 的輸出。

```json

```

## Actual Observation

- 驗證日期與時間：
- Inspector extension version:
- Chrome full version:
- 實際結果是否只包含核准的欄位：
- 是否發現 detail URL：
- 是否發現 mutation capability：
- 實際行為與契約不一致之處：
- 結論：待實際原生 Inspector 手動驗證填寫。

## Notes

- 若原生 Inspector 無法執行或未取得結果，請如實記錄原因；這是有效的手動驗證結果，不得補填推測資料。
- 不得在此文件放入 API key、token、帳密或其他敏感資料。
