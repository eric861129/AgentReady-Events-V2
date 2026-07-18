# Day 15–18 Native Chrome Evidence Reissue

## Purpose

在對外發布前，將 2026-07-18 的實際 Chrome 原生 runtime 不支援證據補入 Day 15、Day 16 與 Day 18 的讀者快照。這次重發不是把三個 ref 全部指到最新 HEAD；每個 Day 只收錄當日及先前日數應有的證據文件。

## Actual Runtime Result

實際 Chrome 依序開啟三個正式快照時，皆觀測到 `document.modelContext` 不可用。因此沒有可註冊、探索或呼叫的原生 Tool；沒有以 browser test double、預期 JSON 或假造 `errorCode` 取代結果。Chrome full version 仍待使用者由 `chrome://version` 手動補錄，因本操作環境封鎖該 URL。

## Ref Transition Plan

| Reader ref | Previous commit | Reissue contents |
| --- | --- | --- |
| `day-15-agent-discovery` | `260b0649257c3418fbdf2fd6db252b109b67a68c` | Day 15 actual Chrome unsupported capture。 |
| `day-16-search-events-invocation` | `1d33827bb23624600006264d8d5483c0ea7625be` | Day 15–16 actual Chrome unsupported captures；不帶入 Day 18 結果。 |
| `day-18-search-events-errors` | `7a1654c77667a1dbd4172cac25147b7b2121c171` | Day 15–18 actual Chrome unsupported captures與完整 runtime matrix。 |

每個舊 commit 會先保留在明確的 `archive/prepublish-native-evidence/*` tag，再逐一以乾淨 clone 進行 build／smoke test 後更新正式 ref。

## External Assets

- `WEBMCP-iThome-2026-Draft-V2/assets/day-15/runtime-native-chrome-unsupported.png`
- `WEBMCP-iThome-2026-Draft-V2/assets/day-16/runtime-native-chrome-unsupported.png`
- `WEBMCP-iThome-2026-Draft-V2/assets/day-18/runtime-native-chrome-unsupported.png`

以上三張是實際 Chrome 不支援畫面；原生 Inspector 的成功／失敗 capture 檔名仍維持 pending，未被取代。
