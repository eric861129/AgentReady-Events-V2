# Task 15：Day 25／26 預發布 reader snapshot 重發行報告

> 執行日期：2026-07-21（Asia/Taipei）
>
> 範圍：只更新 Day 25／26 的 public reader branch 與 annotated tag；沒有 push
> `main`、`feature/*` 或外部文章草稿。

## 結果

Day 25 browser journey attachment 的 `rawOutput` 改為逐字保存 Tool transport string。
文章尚未於 2026-08-01 對外發布，因此依預發布授權重發行兩個 formal snapshot。舊 ref
先以 archive branch 與 annotated archive tag 保存，之後才以每一個 ref 指定 expected old
object 的 `--force-with-lease` 更新 formal refs。

| Day | 原 commit／archive branch | archive annotated tag | 目前 branch 與 tag peeled commit |
| ---: | --- | --- | --- |
| 25 | `e8a0590a9ed2faba6f871b53fedcf48f280272af`／`archive/day-25-agent-journey-pre-raw-evidence` | `v0.1.0-day-25-pre-raw-evidence` | `f071bf2af29056db800bbacb25b54035bd453de2` |
| 26 | `fb07f4a0f784be25b9f66f58fd1fe4e77e7c4c02`／`archive/day-26-server-authorization-pre-raw-evidence` | `v0.1.0-day-26-pre-raw-evidence` | `ecf9082ccc9caba9538a65acee2a3f0cf52c88bf` |

`ecf9082` 是在 Day 26 snapshot 上套用同一份 raw-evidence 修正的獨立 commit，不是
`f071bf2` 的 Git ancestor。已用 `git diff --exit-code f071bf2 ecf9082 --` 比對 Day 25
四個修正檔（browser spec、integration spec、test double、evidence document），結果為
零差異；再比對 `fb07f4a..ecf9082`，確認 Day 26 原有的 server boundary tests 沒有遺失。

## Remote ref 驗證

`git ls-remote --heads --tags origin` 的結果如下；`^{}` 是 annotated tag dereference：

| remote ref | object／peeled commit |
| --- | --- |
| `archive/day-25-agent-journey-pre-raw-evidence` | `e8a0590a9ed2faba6f871b53fedcf48f280272af` |
| `v0.1.0-day-25-pre-raw-evidence` | tag object `025fa8a55516f6bcaa855ac429121c5a9e18b4d5`；`^{}` → `e8a0590a9ed2faba6f871b53fedcf48f280272af` |
| `day-25-agent-journey` | `f071bf2af29056db800bbacb25b54035bd453de2` |
| `v0.1.0-day-25` | tag object `905ae45711ab7da7c8583fc2997f54f939959272`；`^{}` → `f071bf2af29056db800bbacb25b54035bd453de2` |
| `archive/day-26-server-authorization-pre-raw-evidence` | `fb07f4a0f784be25b9f66f58fd1fe4e77e7c4c02` |
| `v0.1.0-day-26-pre-raw-evidence` | tag object `d6e50a4de56582e8e9ae4266983f8d6809e80edb`；`^{}` → `fb07f4a0f784be25b9f66f58fd1fe4e77e7c4c02` |
| `day-26-server-authorization` | `ecf9082ccc9caba9538a65acee2a3f0cf52c88bf` |
| `v0.1.0-day-26` | tag object `ba9e36245a65bd94c579800d2c64a9ccb8c8d94b`；`^{}` → `ecf9082ccc9caba9538a65acee2a3f0cf52c88bf` |

Push 前以 `gh auth status` 與 `gh repo view` 確認 active account 是 repository owner
`eric861129`（`ADMIN`）。archive refs 以 non-force refspec 建立；formal branches 與 tags
各自使用精確 `--force-with-lease=<ref>:<old-object>`，沒有 broad force push。

## Fresh-clone gate

原始 clone、gate log、port isolation log 與 `summary.json` 位於：

`D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-smoke-task15-reissue-20260721-c`

所有 clone 都來自 GitHub 的 `https://github.com/eric861129/AgentReady-Events-V2.git`，採
`git clone --single-branch --branch <formal-ref>`。每一個 browser suite 前後都確認
127.0.0.1:4173／8787 沒有 listener，避免重用另一個 clone 的 Vite 或 Demo API。

| formal ref | HEAD | npm ci | typecheck | Vitest | Playwright | build | strict UTF-8 靜態檢查 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `v0.1.0-day-25` | `f071bf2` | pass | pass | 18 files／83 tests | 18 passed | pass；19 modules | pass；102 tracked text files |
| `day-25-agent-journey` | `f071bf2` | pass | pass | 18 files／83 tests | 18 passed | pass；19 modules | pass；102 tracked text files |
| `v0.1.0-day-26` | `ecf9082` | pass | pass | 18 files／85 tests | 19 passed | pass；19 modules | pass；104 tracked text files |
| `day-26-server-authorization` | `ecf9082` | pass | pass | 18 files／85 tests | 19 passed | pass；19 modules | pass；104 tracked text files |

`package.json` 沒有 `verify:utf8` script，因此 `npm run verify:utf8` 為 **not applicable**，
不是四道 required package gate 的失敗。作為額外證據，對每個 formal clone 的 tracked
text files 以 strict UTF-8 decoder 解碼，並檢查沒有 U+FFFD replacement character。

## 文件與外部素材更新

- Repository documentation commit：`7e2012a982ec35bb8750b115a9a5fae8e1bec68e`
  `docs(versioning): record Day 25 and 26 pre-release reissue`
- 已更新 `docs/versioning.md`、Day 25／26 evidence、runtime matrix 與 reader snapshot
  smoke 文件，保留 2026-07-20 初次結果與 archive mapping。
- 外部、非 Git 的 `WEBMCP-iThome-2026-Draft-V2` 已把 Day 25／26 文章與 assets README
  中的 current formal SHA 改為 `f071bf2`／`ecf9082`。既有圖片沒有重擷取，因為可見 UI、
  Demo API 與證據類型都沒有改變；test-double、Demo API、非 production audit 的限制仍保留。

## 保留的診斷紀錄與未解決項目

第一次重發行 harness 把 Git 的正常 stderr clone progress 當作 PowerShell error；第二次
run 的 Day 26 tag 又在上一個 suite 清理 web server 的期間重用 port，留下
`ERR_CONNECTION_REFUSED`。兩個 root 都保留作診斷，均不作 release evidence。最終 `-c`
root 已以 port isolation 完成四個 formal ref 的全數 gate。

沒有未解決的 release blocker。這些證據仍是 browser test double／Demo API evidence，
不是 native Chrome Inspector、真實 Agent session 或 production security audit。
