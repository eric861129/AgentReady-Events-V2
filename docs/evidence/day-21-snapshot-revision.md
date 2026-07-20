# Day 21 快照修訂紀錄

> 修訂日期：2026-07-20（Asia/Taipei）

## 修訂原因

Day 21 原正式 reader branch `day-21-save-event` 與 annotated tag `v0.1.0-day-21` 原先都指向：

```text
084e75fa420666981dd208bed99a2d522419ca5d
```

後續審查發現啟動期間存在工具同步競態：事件明細頁若先註冊 `search_events` 與 `save_event`，延遲完成的 demo session 初始化仍會再次執行僅含 `search_events` 的同步，因而覆寫明細頁已註冊的 `save_event`。

修正實作位於 commit `7a2cc83f7985de3db8ea0f982f06c7b04a652302`：應用程式初始化完成 demo session 後改為呼叫可依目前 route 同步完整工具集合的 `synchronizeWebMcpTools()`，避免把明細頁工具集合降回搜尋頁工具集合。

## Ref 修訂與歷史保存

本次只修訂 Day 21 的正式 reader branch 與 annotated tag，使正式 Day 21 快照同時包含競態修正及本修訂紀錄。原始對應關係永久保留於：

- archive branch：`archive/day-21-save-event-pre-review`
- annotated archive tag：`v0.1.0-day-21-pre-review`
- archive refs 的 peeled commit：`084e75fa420666981dd208bed99a2d522419ca5d`

Day 1–20 的 branch 與 tag 不在本次授權範圍內，不得移動或重寫。這是針對已確認缺陷所做的單次 Day 21 快照修訂，不改變其他日期快照不可變的原則。

## Fresh clone 驗收規則

正式 ref 修訂後，必須從 reader branch 建立全新的單一分支 clone，不得沿用開發 worktree 或既有安裝結果：

```powershell
git clone --branch day-21-save-event --single-branch <repository-url> <new-directory>
Set-Location <new-directory>
npm ci
npm run typecheck
npm test
npm run test:browser
npm run build
```

驗收時必須另外確認：

1. fresh clone 的 `HEAD` 與正式 `day-21-save-event` branch 相同。
2. `v0.1.0-day-21^{}` peeled commit 與 fresh clone 的 `HEAD` 相同，且正式 tag 仍為 annotated tag。
3. archive branch 與 archive tag 仍指向原 SHA。
4. 工作樹乾淨，且上述命令全部以 exit code 0 完成。

實際新快照 SHA 與命令輸出應記錄於工作報告或外部發布紀錄；本文件不宣稱自身尚未建立的 commit SHA。
