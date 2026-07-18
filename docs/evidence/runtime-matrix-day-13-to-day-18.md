# Runtime Matrix: Day 13 to Day 18

此矩陣用於分開記錄瀏覽器自動化、Chrome WebMCP flag、Inspector 擴充功能，以及 Gemini 本機 key runtime 的能力與證據。各欄為預期，不可當成已驗證成功；請以實際截圖或證據檔更新最後一欄。任何本機 API key 僅能標示是否已設定，絕不記錄、洩漏或要求其值。

| Runtime | Native support expected | Registration expected | Discovery expected | Invocation expected | Evidence file or screenshot |
| --- | --- | --- | --- | --- | --- |
| Plain Playwright browser | 否；僅作為自動化瀏覽器環境 | 否；不預期 Inspector 原生註冊介面 | 否；無 Inspector Agent 探索流程 | 否；不驗證 Gemini 原生呼叫 | 待填：Playwright 測試輸出或截圖 |
| Chrome with WebMCP flag disabled | 否；WebMCP 測試功能未開啟 | 否；不預期可透過 WebMCP 原生註冊 | 否；不預期 Inspector 可探索 WebMCP Tool | 否；不預期原生 Tool invocation | 待填：Chrome flags 與 Inspector 狀態截圖 |
| Chrome with WebMCP flag enabled and Inspector installed | 是；Chrome WebMCP 測試功能已開啟 | 是；Inspector 應能觀察註冊狀態 | 待實測；須由 Inspector 的實際畫面證明 | 待實測；不以註冊成功推論呼叫成功 | 待填：Inspector 註冊／探索畫面截圖 |
| Chrome Inspector Gemini mode with user API key configured locally | 是；在前列 Chrome 與 Inspector 條件上執行 Gemini | 是；以 Inspector 實際狀態為準 | 待實測；Gemini 是否探索 `search_events` 必須如實記錄 | 待實測；Gemini 是否選取並呼叫 Tool 必須如實記錄 | 待填：Gemini 實際回覆或未選取 Tool 截圖；不包含 API key |

## Actual Chrome Capture: 2026-07-18

此次以實際 Chrome 依序開啟正式讀者快照 Day 15、16、18，而非注入 `document.modelContext`。Chrome full version 待使用者於 `chrome://version` 手動補錄；本操作環境封鎖該 URL，因此不以推測值替代。

| Snapshot | Local URL used | Native support observed | Registration / Inspector outcome | Screenshot |
| --- | --- | --- | --- | --- |
| Day 15 `260b064` | `http://127.0.0.1:4174/` | 否；`document.modelContext` 不可用 | 無法註冊或觀測 Tool；未進入 Inspector/Gemini discovery | `WEBMCP-iThome-2026-Draft-V2/assets/day-15/runtime-native-chrome-unsupported.png` |
| Day 16 `1d33827` | `http://127.0.0.1:4175/` | 否；`document.modelContext` 不可用 | 沒有已註冊 Tool，因此未執行 direct Inspector invocation 或填寫 raw JSON | `WEBMCP-iThome-2026-Draft-V2/assets/day-16/runtime-native-chrome-unsupported.png` |
| Day 18 `7a1654c` | `http://127.0.0.1:4176/?evidenceScenario=temporary-unavailable` | 否；`document.modelContext` 不可用 | 受控錯誤情境無法抵達原生 Tool；未捏造 `errorCode` 結果 | `WEBMCP-iThome-2026-Draft-V2/assets/day-18/runtime-native-chrome-unsupported.png` |

這三筆皆為「實際 Chrome 不支援」的負向證據。它們不讓 browser test double 升格為 native Inspector／Agent 證據，也不將未執行的 Inspector 結果寫成失敗或成功。

## Recording Rules

- Playwright、Chrome flag、Inspector 與 Gemini 本機 key runtime 是四個不同層次；不得將某一列的結果宣稱為另一列的成功。
- Gemini 未選取 Tool 是有效失敗證據。保持 Day 15 指定 prompt 原文，不得改寫為含 Tool name、parameter names 或 `invoke`／`call` 等 action verbs 的內容來強迫使用。
- 若無法完成任何列，請記錄阻礙與可重現條件，不得填寫虛構的 Gemini 或 Inspector 成功結果。
