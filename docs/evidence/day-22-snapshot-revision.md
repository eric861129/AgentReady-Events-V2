# Day 22 快照修訂紀錄

> 修訂日期：2026-07-20（Asia/Taipei）

## 修訂原因

Day 22 原正式 reader branch `day-22-visible-tool-state` 與 annotated tag `v0.1.0-day-22` 都指向：

```text
bc9eabbc52734946437cb79ac788e2ab5211c9e3
```

審查發現兩項缺口：

1. `save_event` Tool 成功寫入 server 後，頁面的 `savedEventIds` 沒有重新從 server hydration，因此活動卡、詳情與「我的收藏」仍可能顯示舊狀態。
2. 雖然應用程式已有先建立 Demo session 再讀取收藏的流程，但沒有 browser regression 證明 delayed `POST /api/demo-session` 完成前不會開始 `GET /api/saved-events`。

修正程式位於 commit `02c7da10154b86e729b2eb883043ffe0155170c5`：

- `createSaveEventTool()` 在維持既有 Tool contract 下接受窄範圍成功 callback；只有 `status: 'ok'` 時才由頁面重讀 server state 並 render。
- browser test double regression 驗證 Tool 成功後三個可見 UI surface 都同步；此證據明確不是 native Agent proof。
- delayed session regression 記錄 `demo-session:start`、`demo-session:complete`、`saved-events:list:start` 的順序。

沒有引入 Day 23 共用 use case refactor、Day 24 URL/detail route lifecycle，亦沒有新增 delete Tool。

## Ref 修訂與歷史保存

原始 Day 22 reader snapshot 永久保留於：

- archive branch：`archive/day-22-visible-tool-state-pre-review`
- annotated archive tag：`v0.1.0-day-22-pre-review`
- archive refs 的 peeled commit：`bc9eabbc52734946437cb79ac788e2ab5211c9e3`

正式 `day-22-visible-tool-state` branch 與 annotated `v0.1.0-day-22` 只會在本修訂的 full gate 與 fresh clone 完成後移到含上述修正及本紀錄的 audit commit。Day 1–21 的正式 refs 不因本次修訂移動。

## Fresh clone 驗收規則

```powershell
git clone --branch day-22-visible-tool-state --single-branch <repository-url> <new-directory>
Set-Location <new-directory>
npm ci
npm run typecheck
npm test
npm run test:browser
npm run build
```

驗收必須確認：

1. fresh clone `HEAD`、`day-22-visible-tool-state` 與 `v0.1.0-day-22^{}` peeled commit 相同，正式 tag 為 annotated tag。
2. archive branch 與 archive tag 都仍 peeled 到 `bc9eabbc52734946437cb79ac788e2ab5211c9e3`。
3. browser test double 和 delayed-fetch tests 均標示其證據邊界，不可視為 native Agent proof。
4. working tree 乾淨，且所有命令 exit code 均為 0。

實際 audit snapshot SHA 與 remote ref 驗證輸出記錄於 Task 6 report；本文件不預先宣稱尚未建立的最終文件 commit SHA。

## 第二次修訂：browser suite shared-state isolation

Day 22 第一次修訂後的正式 reader branch `day-22-visible-tool-state` 與 annotated tag `v0.1.0-day-22` 都指向：

```text
83bf62180217ddafd832be11c88e3ed6665b64d0
```

後續 re-review 確認最小 Demo API 有意使用唯一的 `demo-reader` principal。正常 Playwright browser suite 若並行執行，測試會共享同一份 server-side 收藏 state，因而可能產生不穩定的測試結果；這是 test isolation 問題，不應透過新增 test-only identity 或擴張授權模型解決。

修正程式位於 commit `64b109551268e24532fe1b7cab661ea2e1232b7d`：

- `playwright.config.ts` 僅針對一般 `tests/browser` suite 設定 `workers: 1`。
- `tests/playwright-config.test.ts` 鎖定此設定與固定 principal 的理由。
- `playwright.button-copy-experiment.config.ts` 不變；沒有修改 API identity、認證或 Day 23/24 功能。

第一次修訂 snapshot 永久保留於：

- archive branch：`archive/day-22-visible-tool-state-pre-parallel-fix`
- annotated archive tag：`v0.1.0-day-22-pre-parallel-fix`
- archive refs 的 peeled commit：`83bf62180217ddafd832be11c88e3ed6665b64d0`

full gates 與 fresh clone 完成後，正式 Day 22 reader branch/tag 會移到含本隔離修正與本段審計紀錄的 final correction commit。遠端更新前必須確認正式 ref 仍指向 `83bf621`；只允許對這兩個正式 Day 22 refs 使用精確的 `--force-with-lease`，archive refs 一律正常 push。
