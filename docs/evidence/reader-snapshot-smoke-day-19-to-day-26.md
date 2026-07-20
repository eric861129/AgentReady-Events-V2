# Day 19–26 reader snapshot fresh-clone smoke

> 取證日期：2026-07-20（Asia/Taipei）
>
> Node.js：`v24.15.0`
>
> 下載原則：annotated tag 是文章的 primary ref；同日 branch 是 convenience ref。

## 方法與保存位置

每個 tag 與 branch 都以全新的 `git clone --branch <ref> --single-branch`
目錄驗證，沒有共用 checkout、沒有複製既有 worktree，也沒有刪除 smoke 目錄。Day
24–26 尚未公開時，clone source 使用同一 repository 的
`file:///D:/MySelf/iThome-2026/WebMCP/AgentReady-Events-V2` URL；所有 gate 通過且
local ref 再驗證後才發布六個新 ref。

每個 clone 固定依序執行：

```powershell
npm ci
npm run typecheck
npm test
npm run test:browser
npm run build
```

原始 clone、command logs 與 summary 保留在：

- `D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-smoke-task11-20260720-230313`
- `D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-smoke-task11-retry-20260720-231328`
- 首次 harness 判定問題：
  `D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-smoke-task11-20260720-230236`

## Primary tag 結果

| Day | Tag | clone 開始時間 | 完整 SHA | `npm ci` | typecheck | unit | browser | build |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | `v0.1.0-day-19` | 23:03:13 | `12664f759f33464eb2fc5457ff8f6d4dd289d46d` | pass；0 vulnerabilities | pass | 7 files／35 tests | 8 passed | pass；12 modules |
| 20 | `v0.1.0-day-20` | 23:04:00 | `1e1fcde0e3212ced1c724b782d6e5231eac416d0` | pass；0 vulnerabilities | pass | 7 files／35 tests | 8 passed | pass；12 modules |
| 21 | `v0.1.0-day-21` | 23:04:42 | `d29236e187ccc270fc32fe1472fbed9246b09b02` | pass；0 vulnerabilities | pass | 12 files／60 tests | 10 passed | pass；15 modules |
| 22 | `v0.1.0-day-22` | 23:06:10 | `93b813e66c76312c348a0e4f583bb99292e18d01` | pass；0 vulnerabilities | pass | 13 files／61 tests | 13 passed | pass；15 modules |
| 23 | `v0.1.0-day-23` | 23:07:46 | `d9d1c8dd129c7bf3b94349e480d10bd0e8e531e2` | pass；0 vulnerabilities | pass | 14 files／64 tests | 13 passed | pass；16 modules |
| 24 | `v0.1.0-day-24` | 23:09:25 | `eb023c51b107bd2a12b78b01df7741f646d3c308` | pass；0 vulnerabilities | pass | 17 files／76 tests | 15 passed | pass；19 modules |
| 25 | `v0.1.0-day-25` | 23:13:28 | `e8a0590a9ed2faba6f871b53fedcf48f280272af` | pass；0 vulnerabilities | pass | 18 files／82 tests | 18 passed | pass；19 modules |
| 26 | `v0.1.0-day-26` | 23:15:18 | `fb07f4a0f784be25b9f66f58fd1fe4e77e7c4c02` | pass；0 vulnerabilities | pass | 18 files／84 tests | 19 passed | pass；19 modules |

## Convenience branch 結果

| Day | Branch | clone 開始時間 | 完整 SHA | `npm ci` | typecheck | unit | browser | build |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | `day-19-side-effect-boundaries` | 23:03:39 | `12664f759f33464eb2fc5457ff8f6d4dd289d46d` | pass | pass | 7 files／35 tests | 8 passed | pass |
| 20 | `day-20-human-in-the-loop` | 23:04:20 | `1e1fcde0e3212ced1c724b782d6e5231eac416d0` | pass | pass | 7 files／35 tests | 8 passed | pass |
| 21 | `day-21-save-event` | 23:05:24 | `d29236e187ccc270fc32fe1472fbed9246b09b02` | pass | pass | 12 files／60 tests | 10 passed | pass |
| 22 | `day-22-visible-tool-state` | 23:07:00 | `93b813e66c76312c348a0e4f583bb99292e18d01` | pass | pass | 13 files／61 tests | 13 passed | pass |
| 23 | `day-23-shared-use-case` | 23:08:37 | `d9d1c8dd129c7bf3b94349e480d10bd0e8e531e2` | pass | pass | 14 files／64 tests | 13 passed | pass |
| 24 | `day-24-tool-lifecycle` | 23:10:13 | `eb023c51b107bd2a12b78b01df7741f646d3c308` | pass | pass | 17 files／76 tests | 15 passed | pass |
| 25 | `day-25-agent-journey` | 23:14:21 | `e8a0590a9ed2faba6f871b53fedcf48f280272af` | pass | pass | 18 files／82 tests | 18 passed | pass |
| 26 | `day-26-server-authorization` | 23:16:10 | `fb07f4a0f784be25b9f66f58fd1fe4e77e7c4c02` | pass | pass | 18 files／84 tests | 19 passed | pass |

同日 tag 與 branch 的完整 SHA 全部相同。Day 24–26 的 tags 經 `git cat-file -t`
確認為 annotated tag，不是 lightweight tag。

## 失敗處理紀錄

1. 第一個 harness 因 PowerShell 把 Git 正常寫入 stderr 的 clone progress 視為例外，
   在 Day 19 clone 階段停止。這不是 Git exit failure；該目錄保留，改用新的 smoke
   root 並只依 native exit code 判定。
2. 第一輪 `v0.1.0-day-25` browser gate 在前 15 個 tests 通過後，dev web server
   中途退出，最後 3 個 tests 收到 `ERR_CONNECTION_REFUSED`。同一 clone 立即隔離
   retry 為 18／18 passed；為避免以 retry 掩蓋失敗，又建立第二個全新 clone，從
   `npm ci` 開始完整五項 gate，最終 18／18 browser passed。表格採用第二個完整
   fresh-clone run，首敗 log 仍保留。
3. 所有 snapshot gate 最終均為 exit code 0；沒有修改 snapshot 內容來迎合 smoke。

## Publication 與 main 邊界

Day 24–26 六個正式 refs 先確認 origin 不存在，再以六個精確 refspec、non-force
push。post-push `git ls-remote` 的 branch SHA 與 annotated tag peeled SHA 都符合上表。
首次 push 因 active GitHub credential 指向無權限帳號而收到 403，沒有建立任何 ref；
切換既有 owner credential 後成功，完成即切回原帳號。

本次沒有 push `main`、`feature/*`、archive ref 或文章。local `main` 維持
`431de168c1fe7cc6eed9af27880af3b68eb81aca`；origin 在 publication 前後都沒有
`refs/heads/main`（origin HEAD 仍指向 `day-01-intro`），本次沒有建立它。
