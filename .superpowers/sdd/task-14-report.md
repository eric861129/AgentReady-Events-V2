# Task 14 審查報告：Day 25 原始 Tool 回傳證據修正

## 結論：PASS

審查基準為 `e8a0590..f071bf2`。未發現阻擋 Day 25 預發佈快照修正的問題。

## 需求逐項驗證

1. `rawOutput` 由 `Day25JourneyTestDoubleClient.executeTool()` 直接取得並保存；
   `invokeAndRecord()` 只在保存後以 `JSON.parse(rawOutput)` 產生獨立的 `output`。
   沒有將解析後物件再以 `JSON.stringify()` 當成原始傳輸字串。
2. 每個 invocation step 同時保留可讀的結構化 `output`，供 journey 判斷及斷言使用。
3. 瀏覽器附件使用 `Day25JourneyTestDoubleAttachment`。測試會重新解析附件，逐一確認三個
   invocation step 的 `rawOutput` 為字串，且 `JSON.parse(rawOutput)` 深度等於同 step 的
   `output`。
4. `git diff --name-only e8a0590..HEAD -- src server` 沒有輸出；本修正僅觸及測試支援、
   integration/browser tests、Day 25 證據文件與本報告，沒有改變產品程式、Demo API/session、
   canonical event ID 或 Day 24–26 快照內容。
5. integration 回歸測試刻意令 `rawSearchOutput` 為含換行與縮排的 JSON 字串，並以原字串做
   嚴格比對。若實作退回成 `JSON.stringify(JSON.parse(rawOutput))`，字串格式會變成 compact JSON，
   該斷言會失敗；因此能抓到本次關心的重序列化回歸。
6. `docs/evidence/day-25-agent-journey.md` 明確區分原始 transport string 與 parsed output，
   也標註這是 adapter fake / Playwright browser test double，不宣稱為原生 Chrome Inspector、
   Agent discovery 或正式 Agent 證據。

## 實際驗證

| 指令 | 結果 |
| --- | --- |
| `npm test -- tests/integration/day-25-agent-journey.test.ts` | 1 file、7 tests passed |
| `npm run test:browser -- --grep "Day 25"` | 3 passed |
| `npm run typecheck` | passed |
| `npm test` | 18 files、83 tests passed |
| `npm run test:browser` | 18 passed |
| `npm run build` | typecheck 與 Vite build passed（19 modules transformed） |
| strict UTF-8 decode + U+FFFD scan | 所有本次審查文件皆為有效 UTF-8，且沒有 U+FFFD |
| `git diff --check e8a0590..HEAD` | passed |

## 審查界線

- 本報告是對 Day 25 test-double 證據鏈的審查；它不把 test double 冒充為原生 WebMCP/Chrome
  Inspector/Agent runtime 證據。
- 本次未進行 remote push、tag/branch 重指向或文章資產異動。
