# Day 19–26 runtime evidence matrix

> 取證日期：2026-07-20（Asia/Taipei）；Day 25／26 預發布證據修正：2026-07-21
>
> 原則：native Chrome、browser test double、真實 Demo API 與純 HTTP tests 不互相替代。

## 證據類型

| 類型 | 能證明什麼 | 不能宣稱什麼 |
| --- | --- | --- |
| unit／integration | schema、route guard、journey 停止條件與 use case 契約 | 原生 Chrome 已 discovery／invoke Tool |
| 純 HTTP／server tests | status、`errorCode`、session collection 前後狀態 | UI 或 Agent 真的走完流程 |
| Playwright browser test double | 頁面整合、Tool inventory、input/output、UI state | 原生 Inspector、Gemini 或真實 Agent session |
| Playwright + 真實 Demo API | 瀏覽器畫面與同源 API/session 的整合 | production auth/security audit |
| native Chrome observation | 指定版本、flags 與原始 Inspector／Agent 證據 | 本輪沒有取得，不得由 test double 推論 |

## 逐日矩陣

| Day | Snapshot | 主要可執行證據 | Browser 證據 | Native 狀態 |
| ---: | --- | --- | --- | --- |
| 19 | `12664f7` | 風險／副作用邊界文件；baseline 35 unit passed | baseline 8 passed；沒有新增 runtime claim | 未執行 |
| 20 | `1e1fcde` | 人類確認契約文件；baseline 35 unit passed | baseline 8 passed；沒有新增 runtime claim | 未執行 |
| 21 | `d29236e` | `save_event`、session API 與 route mismatch tests；60 unit passed | 10 passed；browser test double 與真實 Demo API 混合 suite | 未執行 |
| 22 | `93b813e` | 收藏 state hydration／同步；61 unit passed | 13 passed；包含真實 Demo API UI state 與 test double Tool save | 未執行 |
| 23 | `d9d1c8d` | UI／Tool 共用 save use case；64 unit passed | 13 passed；共用行為 regression | 未執行 |
| 24 | `eb023c5` | `detailUrl`、route lifecycle、stale handler 與 mismatch no-HTTP；76 unit passed | 15 passed；Day 24 JSON attachment 是 browser test double | 未執行 |
| 25 | `f071bf2` | 完整 journey、empty／error／mismatch／non-changing save 停止條件；83 unit passed；attachment 原樣保存 Tool transport string | 18 passed；完整 journey attachment 明確是 browser test double | `UNSUPPORTED_FOR_THIS_EVIDENCE_RUN` |
| 26 | `ecf9082` | 85 unit passed；server tests 驗證 401／400／404、`errorCode` 與 collection 不變；包含 Day 25 raw evidence 修正 | 19 passed；Day 26 測試使用真實 Demo API，沒有安裝 WebMCP test double | 未執行 |

Day 25 的 native 狀態詳見
[`day-25-native-observation.md`](./day-25-native-observation.md)。Day 26 的 DOM
修改只建立「畫面不是 source of truth」的反例；成功或拒絕仍以 API response 與
session state 判定。

Day 25／26 的修正只改變 journey attachment 如何保存 `rawOutput`，不改變畫面、
Demo API 或 native observation。因此既有截圖與 Vite proxy 原始 HTTP artifacts 無須重擷取；
其原始 snapshot 仍可由 `*-pre-raw-evidence` archive ref 取得，正式 reader ref 的
目前 mapping 與 fresh-clone gate 另見
[`reader-snapshot-smoke-day-19-to-day-26.md`](./reader-snapshot-smoke-day-19-to-day-26.md)。

## `npm run dev`／Vite proxy smoke

Day 21–26 各自使用 primary tag fresh clone 啟動 `npm run dev`，所有 HTTP 都送到
Vite `http://127.0.0.1:5173`，不是直接繞到 API port。每次使用新 session cookie，
並在切換下一日之前確認 5173／8787 listener 已釋放。

下表不是只記相對 route。每一格都列出 curl 實際送出的 `requestUrl`；raw transcript
另存 curl 回報的 `effectiveUrl`，六日三個 request 都與 `requestUrl` 完全相同。

| Day | checked at | GET UI requestUrl | POST session requestUrl | PUT save requestUrl |
| ---: | --- | --- | --- | --- |
| 21 | 23:52:09 | `http://127.0.0.1:5173/` → 200 | `http://127.0.0.1:5173/api/demo-session` → 201 | `http://127.0.0.1:5173/api/saved-events/event-frontend-summit` → 200 |
| 22 | 23:52:18 | `http://127.0.0.1:5173/` → 200 | `http://127.0.0.1:5173/api/demo-session` → 201 | `http://127.0.0.1:5173/api/saved-events/event-frontend-summit` → 200 |
| 23 | 23:52:26 | `http://127.0.0.1:5173/` → 200 | `http://127.0.0.1:5173/api/demo-session` → 201 | `http://127.0.0.1:5173/api/saved-events/event-frontend-summit` → 200 |
| 24 | 23:52:31 | `http://127.0.0.1:5173/` → 200 | `http://127.0.0.1:5173/api/demo-session` → 201 | `http://127.0.0.1:5173/api/saved-events/event-frontend-summit` → 200 |
| 25 | 23:52:36 | `http://127.0.0.1:5173/` → 200 | `http://127.0.0.1:5173/api/demo-session` → 201 | `http://127.0.0.1:5173/api/saved-events/event-frontend-summit` → 200 |
| 26 | 23:52:42 | `http://127.0.0.1:5173/` → 200 | `http://127.0.0.1:5173/api/demo-session` → 201 | `http://127.0.0.1:5173/api/saved-events/event-frontend-summit` → 200 |

六日的 session response 都是 `status: ok`，cookie jar 都包含 `demo_session`；PUT
response 都是 `saved: true, changed: true`。

原始 response、cookie、dev output 與 `summary.json` 保留於：

`D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-runtime-task11-review-20260720-234500`

每一日都有以下可稽核 raw artifacts：

- `day-XX-dev.log`：`npm run dev` output 加上三行 `REQUEST`，直接顯示 method、
  `requestUrl`、`effectiveUrl` 與 status；Day 26 的完整檔案是 `day-26-dev.log`。
- `day-XX-request-transcript.json`：保存 `baseUrl`、三個 curl command、三組
  `requestUrl/effectiveUrl/status`。
- `day-XX-*.headers.txt`、response body 與 cookie jar。
- `summary.json`：六筆 snapshot SHA、`baseUrl`、個別 request/effective URL、status、
  response 摘要、transcript 與 dev log path。

六份 dev logs、六份 transcripts 與 headers 皆以 strict UTF-8 解碼並檢查無亂碼；
coordinator 完成後確認 5173／8787 無 listener。舊的
`AgentReady-Events-V2-runtime-task11-20260720-232500` 僅保留歷史診斷，不再作本節的
release evidence。

## 固定 reviewer gates

- 正式 WebMCP Tool 只有 `search_events`、`get_event_details`、`save_event`；取消收藏
  只有人類 UI／HTTP 行為，沒有第四個正式 Tool。
- `save_event` input 只有 `eventId`；client 沒有 user ID input。測試中的偽造
  `userId` 是拒絕證據，server principal 才是資料歸屬來源。
- `ROUTE_MISMATCH` 在 HTTP 前停止；`errorCode` 保留 discriminated contract。
- `git grep detailUrl v0.1.0-day-17 -- src` 與 Day 18 同命令都沒有結果；Day 17／18
  historical contract 未被改寫。
- 本輪不產生最終文章 screenshot，也不撰寫對外文章。
