# Day 19–26 開發基線紀錄

> 取證時間：2026-07-20。以下命令皆以唯讀方式執行；完整 SHA 保留於此，作為 Day 19–26 唯一開發基線的追溯證據。

## 不可變歷史清單

| Ref | 完整 SHA | 說明 |
|---|---|---|
| `main` | `8d12bed7dc143cc103baa5610a4e3b54841550c0` | 既有主分支；短 SHA 為 `8d12bed`。 |
| `v0.1.0-day-17` | `04a7185418f3aa973ed56dae48c49fd9ea7b6d5e` | Day 17 歷史 tag。 |
| `v0.1.0-day-18` | `615ee1c10ada38ce70c924a5e80ae272ff18fc9c` | Day 18 baseline；短 SHA 為 `615ee1c`。 |
| `day-18-search-events-errors` | `615ee1c10ada38ce70c924a5e80ae272ff18fc9c` | 符合 `day-18-*` 的既有 reader branch，與 Day 18 tag 相同。 |
| `feature/day-19-to-day-26-agent-journey`（建立時） | `615ee1c10ada38ce70c924a5e80ae272ff18fc9c` | Day 19–26 唯一開發分支的起點。 |

基線建立指令如下；`git reflog` 顯示 feature branch 是由 `v0.1.0-day-18` 建立，而非複製既有 checkout：

```powershell
git -C D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2 worktree add `
  D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-day19-26 `
  -b feature/day-19-to-day-26-agent-journey v0.1.0-day-18

git reflog show --format='%H %gs' feature/day-19-to-day-26-agent-journey
# 615ee1c10ada38ce70c924a5e80ae272ff18fc9c branch: Created from v0.1.0-day-18
```

## Ancestor 關係

| 唯讀驗證命令 | Exit code | 結果 |
|---|---:|---|
| `git merge-base --is-ancestor main v0.1.0-day-18` | 0 | `main=8d12bed` 是 Day 18 baseline 的 ancestor。 |
| `git merge-base --is-ancestor v0.1.0-day-17 v0.1.0-day-18` | 1 | Day 17 tag 不是 Day 18 baseline 的 ancestor；僅記錄既有歷史，不調整 ref。 |
| `git merge-base --is-ancestor day-18-search-events-errors v0.1.0-day-18` | 0 | Day 18 reader branch 是 Day 18 tag 的 ancestor（同一 commit）。 |
| `git merge-base --is-ancestor v0.1.0-day-18 HEAD` | 0 | Day 18 baseline 是 Day 19–26 feature HEAD 的 ancestor。 |

## 基線驗證結果

於尚未加入 Task 1 文件時執行下列命令，結果全部成功：

| 命令 | 結果 |
|---|---|
| `npm ci` | 成功；新增 50 個套件，稽核 51 個套件，0 vulnerabilities。 |
| `npm run typecheck` | 成功；`tsc --noEmit` 無錯誤。 |
| `npm test` | 成功；7 個 test files、35 個 tests 全數通過。 |
| `npm run test:browser` | 成功；8 個 Playwright tests 全數通過。 |
| `npm run build` | 成功；完成 typecheck 與 Vite production build。 |

當時 `git diff --quiet v0.1.0-day-18..HEAD` 的 exit code 為 0，表示 feature branch 起點與 Day 18 tag 完全相同。Task 1 後的差異僅限本文件與 `docs/versioning.md`。
