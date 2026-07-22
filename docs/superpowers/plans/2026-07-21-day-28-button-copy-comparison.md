# Day 28：按鈕文案與 Tool contract 對照實作計畫

> 這是功能分支內部的執行計畫，不納入讀者 Day 28 快照。

**目標：** 在不改動 Day 5 實驗、按鈕文案、Tool 名稱／描述或活動資料的前提下，留下可重跑的對照證據：固定的 Playwright locator 因找不到「搜尋活動」按鈕而失敗；相同的 `query: "前端"` 直接呼叫正式 `createSearchEventsTool(...).execute()` 仍回傳 `event-frontend-summit`。

**架構：** Day 5 保持為唯一的 UI 自動化失敗實驗。Day 28 新增一個直接呼叫正式 Tool 的單元測試、一個明確接受 Day 5 預期失敗的比較入口，以及一個只在測試／擷取時注入的視覺證據面板。面板不能改變產品 DOM、不能模擬原生 Agent，也不能接觸 `document.modelContext`。

**技術：** TypeScript、Vitest、Playwright、tsx、Vite。

---

## Task 1：固定兩端的可重跑驗證入口

**Files：**
- Modify: `package.json`
- Modify: `playwright.button-copy-experiment.config.ts`
- Create: `tests/day-28-search-events-tool.test.ts`
- Create: `scripts/verify-day-28-comparison.ts`

1. 先執行 `npm run test:browser:button-copy`，若既有 webServer 設定沒有把 Vite 固定啟動在 4173，僅把啟動設定修正為 Demo API 加上 `dev:web -- --port 4173`；不修改 Day 5 spec、按鈕或資料。確認未修改的 Day 5 實驗會因原始 locator `getByRole('button', { name: '搜尋活動', exact: true })` 找不到按鈕而失敗。
2. 撰寫失敗測試：新增 Day 28 Tool 測試，先執行它並確認尚無檔案時失敗。
3. 直接 import 正式 `createSearchEventsTool`，以固定 `detailUrlFor` 執行 `.execute({ query: '前端' })`；保留 raw JSON 字串並驗證 `status: 'ok'` 與 `eventId: 'event-frontend-summit'`。
4. 新增 `test:day-28:tool` 與 `test:day-28`：後者必須把 Day 5 的非零結束視為預期結果、保留 stdout/stderr，並在 Tool 成功後輸出結構化摘要；若 Day 5 意外成功或 Tool 失敗，整體必須失敗。
5. 依序執行 `npm run test:day-28:tool`、`npm run test:day-28`，確認兩端結果符合預期。

## Task 2：保存清楚揭露邊界的並列視覺與 JSON 證據

**Files：**
- Create: `tests/browser/day-28-button-copy-comparison.spec.ts`
- Create: `scripts/capture-day-28-comparison.mjs`
- Modify: `package.json`
- Create (generated): `docs/evidence/assets/day-28-button-copy-comparison.png`
- Create (generated): `docs/evidence/assets/day-28-tool-result.json`
- Create (generated): `docs/evidence/assets/day-28-day-05-failure.txt`

1. 撰寫 browser 測試，先確認目前真正的按鈕文字是「開始搜尋」、原始精確 locator 的 count 為 0。
2. 在 Node test process 直接執行正式 `createSearchEventsTool(...).execute({ query: '前端' })`，驗證 Tool JSON；不得使用 browser test double 或 `document.modelContext`。
3. 只在該頁測試 runtime 注入並列證據面板，明示「Tool 直接執行」、「不是原生 Agent」、「不代表 WebMCP 取代 UI 測試」；以完整頁面截圖與 JSON attachment 保存。
4. Day 28 比較入口保存 Day 5 的完整失敗輸出；獨立 capture script 啟動（或連線至）Vite server、重複同一組檢查，輸出 reader snapshot 中的 PNG 與 raw Tool JSON；兩者都不寫入產品程式碼。
5. 執行 browser 比較測試與 capture script，使用影像檢視確認截圖的中文、兩欄內容和邊界揭露都清楚可讀。

## Task 3：文件、全量驗證與讀者快照

**Files：**
- Create: `docs/evidence/day-28-button-copy-comparison.md`
- Modify only if evidence requires it: `package.json`

1. 文件記錄不變條件（Day 5 檔案、按鈕文字、Tool 名稱／描述、query、catalog）、預期失敗命令、正式 Tool raw JSON、截圖路徑及證明邊界。
2. 執行 `npm run test:day-28`、`npm run typecheck`、`npm test`、`npm run test:browser`、`npm run build`；記錄真正的通過數字與 Day 5 預期失敗訊息。
3. 審查 diff，確認沒有修改 Day 5 實驗、`src/main.ts`、`src/webmcp/search-events-tool.ts` 或測試活動資料。
4. 提交 Day 28 實作；自目前 commit 建立 `day-28-button-copy-comparison` 分支及帶註解 tag `v0.1.0-day-28`。
5. 在新的讀者 ref 上重跑 `npm ci`、Day 28 比較入口、typecheck、build，確認快照可獨立重現。保留 Day 27 ref 不移動，也不合併或推送功能分支。
